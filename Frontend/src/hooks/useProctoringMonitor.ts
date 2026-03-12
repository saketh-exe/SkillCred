import { useState, useEffect, useRef, useCallback } from 'react'
import { FaceLandmarker, ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision'

// ── Types ──────────────────────────────────────────────────────────────────

export type GazeDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown'

export interface ProctoringViolation {
  id: string
  type: 'multiple_faces' | 'no_face' | 'gaze_away' | 'phone_detected'
  message: string
  timestamp: number
  gazeDirection?: string
}

export interface ProctoringStatus {
  faceCount: number
  gazeDirection: GazeDirection
  phoneDetected: boolean
  isReady: boolean
  streamActive: boolean
  error: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'

const FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const OBJ_MODEL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'

// Violation trigger thresholds (ms of continuous detection before logging)
const MULTIPLE_FACES_MS = 3000
const NO_FACE_MS = 5000
const GAZE_AWAY_MS = 5000
const PHONE_MS = 300

// Cooldown after a violation fires to prevent log spam
const COOLDOWN_MS = 8000

// Object detector runs every N ms (heavy model — 500 ms for near-real-time phone detection)
const OBJ_INTERVAL_MS = 250

// ── Gaze estimation ────────────────────────────────────────────────────────
// Uses MediaPipe iris landmarks (indices 468/473) relative to eye corners to
// estimate where the candidate is looking.

type Lm = { x: number; y: number; z: number }

function estimateGaze(lms: Lm[]): GazeDirection {
  if (lms.length < 478) return 'unknown'

  // Eye corners (person-centric labels).
  // In the raw unmirrored camera image, person's LEFT side = camera-RIGHT = high x.
  const lo  = lms[33],  lin = lms[133]   // person's left eye:  outer, inner
  const rin = lms[362], ro  = lms[263]   // person's right eye: inner, outer

  const lw = Math.abs(lin.x - lo.x)
  const rw = Math.abs(ro.x - rin.x)
  if (lw < 0.005 || rw < 0.005) return 'unknown'

  // ── Iris gaze (eyes-only movement) ──────────────────────────────────────
  const li = lms[468], ri = lms[473]
  const lgx = (li.x - (lo.x + lin.x) / 2) / (lw / 2)
  const lgy = (li.y - (lo.y + lin.y) / 2) / (lw / 2)
  const rgx = (ri.x - (rin.x + ro.x) / 2) / (rw / 2)
  const rgy = (ri.y - (rin.y + ro.y) / 2) / (rw / 2)
  const irisGx = (lgx + rgx) / 2
  const gy     = (lgy + rgy) / 2

  // ── Head yaw (nose-tip offset from eye midpoint) ─────────────────────────
  // When the person turns their head to THEIR LEFT, the nose projects toward
  // camera-right (high x), so headYaw > 0 = person's left — same convention
  // as irisGx.
  const nose  = lms[1]                           // nose tip
  const faceW = Math.abs(lo.x - ro.x)           // lo > ro in raw image
  const headYaw = faceW > 0.04
    ? (nose.x - (lo.x + ro.x) / 2) / (faceW / 2)
    : 0

  // Blend: weighted average of iris signal and head-turn signal.
  // This catches BOTH "eyes slide sideways" and "head rotates".
  const gx = irisGx * 0.55 + headYaw * 0.45

  // gx > 0 → person's LEFT  |  gx < 0 → person's RIGHT
  if (Math.abs(gx) > 0.22 && Math.abs(gx) > Math.abs(gy) * 0.75) return gx > 0 ? 'left' : 'right'
  if (gy < -0.18) return 'up'
  if (gy > 0.28)  return 'down'
  return 'center'
}

// ── Hook ──────────────────────────────────────────────────────────────────

interface Options {
  /** Whether the user has enabled camera monitoring */
  enabled: boolean
  /** Whether a quiz is actively in progress (violations only logged when true) */
  quizActive: boolean
}

const DEFAULT_STATUS: ProctoringStatus = {
  faceCount: 0,
  gazeDirection: 'unknown',
  phoneDetected: false,
  isReady: false,
  streamActive: false,
  error: null,
}

export function useProctoringMonitor({ enabled, quizActive }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<ProctoringStatus>(DEFAULT_STATUS)
  const [violations, setViolations] = useState<ProctoringViolation[]>([])
  const [activeWarning, setActiveWarning] = useState<string | null>(null)

  // Model references
  const faceLMRef   = useRef<FaceLandmarker | null>(null)
  const objDetRef   = useRef<ObjectDetector | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number | null>(null)
  const isReadyRef  = useRef(false)
  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Attach stream to video element — called both when stream first arrives
  // and when the video element mounts (whichever comes second).
  const attachStream = useCallback((video: HTMLVideoElement, stream: MediaStream) => {
    if (video.srcObject !== stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    }
  }, [])

  // Continuous-detection start timestamps (null = not currently detected)
  const tMultiFace  = useRef<number | null>(null)
  const tNoFace     = useRef<number | null>(null)
  const tGazeAway   = useRef<number | null>(null)
  const tPhone      = useRef<number | null>(null)
  const lastObjRun  = useRef(0)
  // Persists phone detection result between OD runs so status doesn't flicker false
  const lastPhoneResult = useRef(false)
  // Gaze smoothing: majority-vote over last N raw readings to prevent stutter
  const gazeHistory = useRef<GazeDirection[]>([])
  const GAZE_HISTORY_LEN = 8

  // ── Violation logger ─────────────────────────────────────────────────────

  const logViolation = useCallback((
    type: ProctoringViolation['type'],
    message: string,
    gazeDirection?: string,
  ) => {
    const v: ProctoringViolation = {
      id: `${type}-${Date.now()}`,
      type, message, timestamp: Date.now(), gazeDirection,
    }
    setViolations(prev => [...prev, v])
    setActiveWarning(message)
    if (warnTimer.current) clearTimeout(warnTimer.current)
    warnTimer.current = setTimeout(() => setActiveWarning(null), 5000)
  }, [])

  // ── Frame-level violation checker ────────────────────────────────────────

  const checkViolations = useCallback((
    faceCount: number,
    gaze: GazeDirection,
    phone: boolean,
    now: number,
  ) => {
    // Multiple faces (3-second window)
    if (faceCount > 1) {
      if (tMultiFace.current === null) tMultiFace.current = now
      else if (now - tMultiFace.current >= MULTIPLE_FACES_MS) {
        logViolation('multiple_faces', `${faceCount} people visible for 3+ seconds`)
        tMultiFace.current = now + COOLDOWN_MS
      }
    } else { tMultiFace.current = null }

    // No face (5-second window — may be repositioning)
    if (faceCount === 0) {
      if (tNoFace.current === null) tNoFace.current = now
      else if (now - tNoFace.current >= NO_FACE_MS) {
        logViolation('no_face', 'No face detected for 5+ seconds')
        tNoFace.current = now + COOLDOWN_MS
      }
    } else { tNoFace.current = null }

    // Gaze away from screen (5-second window)
    const gazeAway = gaze !== 'center' && gaze !== 'unknown'
    if (gazeAway) {
      if (tGazeAway.current === null) tGazeAway.current = now
      else if (now - tGazeAway.current >= GAZE_AWAY_MS) {
        logViolation('gaze_away', `Looking ${gaze} for 5+ seconds`, gaze)
        tGazeAway.current = now + COOLDOWN_MS
      }
    } else { tGazeAway.current = null }

    // Phone detected (2-second confirmation window)
    if (phone) {
      if (tPhone.current === null) tPhone.current = now
      else if (now - tPhone.current >= PHONE_MS) {
        logViolation('phone_detected', 'Mobile phone detected in frame')
        tPhone.current = now + COOLDOWN_MS
      }
    } else { tPhone.current = null }
  }, [logViolation])

  // ── Frame processor ───────────────────────────────────────────────────────

  const processFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !faceLMRef.current || !isReadyRef.current) return
    if (video.readyState < 2 || video.videoWidth === 0) return

    const now = performance.now() // monotonically increasing — MediaPipe requirement
    const wallNow = Date.now()

    // Face detection + gaze (every frame)
    let faceCount = 0
    let rawGaze: GazeDirection = 'unknown'
    try {
      const r = faceLMRef.current.detectForVideo(video, now)
      faceCount = r.faceLandmarks.length
      if (faceCount > 0) rawGaze = estimateGaze(r.faceLandmarks[0] as Lm[])
    } catch { /* ignore single-frame errors */ }

    // Smooth gaze: keep a rolling buffer and pick the most-frequent direction.
    // This eliminates rapid oscillation between up/down/center on noisy frames.
    gazeHistory.current.push(rawGaze)
    if (gazeHistory.current.length > GAZE_HISTORY_LEN) gazeHistory.current.shift()
    const gazeFreq: Partial<Record<GazeDirection, number>> = {}
    for (const g of gazeHistory.current) gazeFreq[g] = (gazeFreq[g] ?? 0) + 1
    const gazeDir = (Object.entries(gazeFreq) as [GazeDirection, number][])
      .reduce((best, cur) => (cur[1] > best[1] ? cur : best), ['unknown' as GazeDirection, 0])[0]

    // Object detection (every 3 s — heavier model)
    // lastPhoneResult persists the result between OD runs to avoid flicker.
    if (objDetRef.current && wallNow - lastObjRun.current >= OBJ_INTERVAL_MS) {
      lastObjRun.current = wallNow
      try {
        const obj = objDetRef.current.detectForVideo(video, now)
        lastPhoneResult.current = obj.detections.some(d =>
          d.categories.some(c => {
            const name = c.categoryName.toLowerCase()
            // 'cell phone' is the COCO label; 'remote' is the common mis-label
            // when a phone is held horizontally (similar rectangular shape).
            const isPhone = name.includes('phone') || name === 'remote'
            return c.score >= 0.2 && isPhone
          })
        )
        // Cross-check: object detector sees people without face landmarks (partial faces)
        const personCount = obj.detections.filter(d =>
          d.categories.some(c => c.categoryName === 'person' && c.score >= 0.5)
        ).length
        if (personCount > faceCount) faceCount = personCount
      } catch { /* ignore */ }
    }
    const phone = lastPhoneResult.current

    checkViolations(faceCount, gazeDir, phone, wallNow)
    setStatus(prev => ({ ...prev, faceCount, gazeDirection: gazeDir, phoneDetected: phone }))
  }, [checkViolations])

  // ── Camera + model initialisation ────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    ;(async () => {
      // 1. Camera stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        // Attach now if video element is already in DOM; otherwise attachStream
        // will be called from the overlay's ref callback when it mounts.
        if (videoRef.current) attachStream(videoRef.current, stream)
        setStatus(prev => ({ ...prev, streamActive: true, error: null }))
      } catch (err) {
        if (!cancelled)
          setStatus(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Camera permission denied',
          }))
        return
      }

      // 2. MediaPipe models (loaded in parallel)
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
        if (cancelled) return

        const [fl, od] = await Promise.all([
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL },
            runningMode: 'VIDEO',
            numFaces: 4,             // detect up to 4 faces
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          }),
          ObjectDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: OBJ_MODEL },
            runningMode: 'VIDEO',
            maxResults: 10,
            scoreThreshold: 0.25,  // lower model threshold so more candidates reach app-level filter
          }),
        ])

        if (cancelled) { fl.close(); od.close(); return }

        faceLMRef.current  = fl
        objDetRef.current  = od
        isReadyRef.current = true
        setStatus(prev => ({ ...prev, isReady: true }))
      } catch (err) {
        if (!cancelled)
          setStatus(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to load AI models',
          }))
      }
    })()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      faceLMRef.current?.close(); faceLMRef.current = null
      objDetRef.current?.close(); objDetRef.current = null
      isReadyRef.current = false
      setStatus(DEFAULT_STATUS)
    }
  }, [enabled])

  // ── RAF frame loop — only while quiz is active ────────────────────────────

  useEffect(() => {
    if (!enabled || !quizActive || !status.isReady) return

    let last = 0
    const tick = (t: number) => {
      if (t - last >= 100) { last = t; processFrame() } // ~10 FPS cap
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
  }, [enabled, quizActive, status.isReady, processFrame])

  // ── Public API ────────────────────────────────────────────────────────────

  const resetViolations = useCallback(() => {
    setViolations([])
    setActiveWarning(null)
    tMultiFace.current = tNoFace.current = tGazeAway.current = tPhone.current = null
    if (warnTimer.current) clearTimeout(warnTimer.current)
  }, [])

  return {
    videoRef,
    streamRef,
    attachStream,
    status,
    violations,
    activeWarning,
    violationCount: violations.length,
    resetViolations,
  }
}
