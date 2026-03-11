import React, { useState } from 'react'
import type { ProctoringStatus, ProctoringViolation, GazeDirection } from '../hooks/useProctoringMonitor'

interface Props {
  videoRef: { current: HTMLVideoElement | null }
  streamRef: { current: MediaStream | null }
  attachStream: (video: HTMLVideoElement, stream: MediaStream) => void
  status: ProctoringStatus
  violations: ProctoringViolation[]
  activeWarning: string | null
  enabled: boolean
  /** If provided, shows a "Verify Identity" button in the PiP */
  onVerifyIdentity?: () => Promise<'match' | 'mismatch' | 'no_face'>
  /** Whether a reference selfie has been captured */
  hasReferenceIdentity?: boolean
}

const GAZE_ICON: Record<GazeDirection, string> = {
  center: '👁️',
  left:   '⬅️',
  right:  '➡️',
  up:     '🔺',
  down:   '🔻',
  unknown:'❓',
}

export function ProctoringOverlay({ videoRef, streamRef, attachStream, status, violations, activeWarning, enabled, onVerifyIdentity, hasReferenceIdentity }: Props) {
  if (!enabled) return null

  const faceOk  = status.faceCount === 1
  const gazeOk  = status.gazeDirection === 'center' || status.gazeDirection === 'unknown'
  const phoneOk = !status.phoneDetected

  const [verifying, setVerifying] = useState(false)
  const [lastResult, setLastResult] = useState<'match' | 'mismatch' | 'no_face' | null>(null)

  const handleVerify = async () => {
    if (!onVerifyIdentity) return
    setVerifying(true)
    setLastResult(null)
    const result = await onVerifyIdentity()
    setLastResult(result)
    setVerifying(false)
    // Clear result badge after 6 s
    setTimeout(() => setLastResult(null), 6000)
  }

  return (
    <>
      {/* Proctoring warning banner — stacked below any tab-leave banner */}
      {activeWarning && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9997] bg-orange-500 text-white px-5 py-2.5 text-sm font-bold shadow-lg rounded-lg whitespace-nowrap">
          ⚠️ Proctoring Alert: {activeWarning}
        </div>
      )}

      {/* Camera PiP — top-right corner */}
      <div className="fixed top-4 right-4 z-50 w-72 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-900 select-none">
        {/*
          The <video> element must always be in the DOM so videoRef is set
          before the stream arrives. We hide it with CSS until streaming starts.
        */}
        <video
          ref={(el) => {
            if (videoRef) (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
            // If stream is already available when the element mounts, attach it now.
            if (el && streamRef.current) attachStream(el, streamRef.current)
          }}
          className={['w-full block', status.streamActive ? '' : 'hidden'].join(' ')}
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          muted
          playsInline
        />
        {!status.streamActive && (
          <div className="w-full h-32 flex items-center justify-center bg-gray-800">
            {status.error ? (
              <span className="text-red-400 text-xs text-center px-2 leading-tight">{status.error}</span>
            ) : (
              <span className="text-gray-400 text-xs">Starting camera…</span>
            )}
          </div>
        )}

        {/* AI models loading indicator */}
        {status.streamActive && !status.isReady && !status.error && (
          <div className="bg-blue-900/70 px-2 py-1 text-xs text-blue-200 text-center">
            Loading AI models…
          </div>
        )}

        {/* Status bar */}
        <div className="bg-gray-900 px-3 py-2 flex items-center gap-3 text-base">
          {/* Face count */}
          <span
            title={`Faces detected: ${status.faceCount}`}
            className={['font-bold', faceOk ? 'text-green-400' : status.faceCount === 0 ? 'text-gray-500' : 'text-red-400'].join(' ')}
          >
            👤 <span className="text-sm">{status.faceCount}</span>
          </span>

          {/* Gaze direction */}
          <span
            title={`Gaze: ${status.gazeDirection}`}
            className={['text-lg', gazeOk ? 'text-green-400' : 'text-yellow-400'].join(' ')}
          >
            {GAZE_ICON[status.gazeDirection]}
          </span>

          {/* Phone */}
          <span
            title={status.phoneDetected ? 'Phone detected!' : 'No phone'}
            className={['font-bold', phoneOk ? 'text-green-400' : 'text-red-400'].join(' ')}
          >
            📱<span className="text-sm ml-0.5">{phoneOk ? '✓' : '⚠'}</span>
          </span>

          {/* Violation count badge */}
          {violations.length > 0 && (
            <span className="ml-auto text-red-400 font-bold text-sm">
              ⚠️ {violations.length}
            </span>
          )}
        </div>

        {/* Label */}
        <div className="bg-gray-950 px-2 py-0.5 text-center">
          <span className="text-gray-500 text-[10px] uppercase tracking-wider">
            {status.isReady ? '● Monitoring' : '○ Proctoring'}
          </span>
        </div>

        {/* Manual identity verify button — only when a reference selfie exists */}
        {onVerifyIdentity && hasReferenceIdentity && (
          <div className="bg-gray-950 px-3 pb-3 pt-1 flex flex-col gap-1.5">
            <button
              onClick={handleVerify}
              disabled={verifying || !status.isReady}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {verifying ? 'Verifying…' : '🪪 Verify Identity'}
            </button>
            {lastResult && (
              <div
                className={[
                  'text-center text-xs font-bold py-1 rounded',
                  lastResult === 'match'
                    ? 'bg-green-900/60 text-green-300'
                    : lastResult === 'no_face'
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-red-900/60 text-red-300',
                ].join(' ')}
              >
                {lastResult === 'match' && '✓ Identity confirmed'}
                {lastResult === 'mismatch' && '✗ Face mismatch detected'}
                {lastResult === 'no_face' && '⚠ No face detected'}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
