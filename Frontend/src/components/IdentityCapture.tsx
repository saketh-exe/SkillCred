import React, { useRef, useState, useEffect } from 'react'

type CaptureStep = 'selfie' | 'id_card'
type CaptureState = 'preview' | 'captured' | 'processing' | 'error'

interface Props {
  streamRef: { current: MediaStream | null }
  faceApiReady: boolean
  faceApiLoadError: string | null
  extractDescriptor: (
    source: HTMLVideoElement,
  ) => Promise<Float32Array | null>
  onComplete: (params: {
    descriptor: Float32Array
    selfieDataUrl: string
    idCardDataUrl: string
  }) => void
}

export function IdentityCapture({
  streamRef,
  faceApiReady,
  faceApiLoadError,
  extractDescriptor,
  onComplete,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [step, setStep] = useState<CaptureStep>('selfie')
  const [captureState, setCaptureState] = useState<CaptureState>('preview')
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)
  const [selfieDescriptor, setSelfieDescriptor] = useState<Float32Array | null>(null)
  const [idCardDataUrl, setIdCardDataUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    }
  })

  const captureSnapshot = (): string | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const handleCaptureSelfie = async () => {
    const video = videoRef.current
    if (!video || !faceApiReady) return
    setCaptureState('processing')
    setErrorMsg(null)
    const descriptor = await extractDescriptor(video)
    if (!descriptor) {
      setCaptureState('error')
      setErrorMsg('No face detected. Ensure your face is clearly visible and well-lit, then try again.')
      return
    }
    const dataUrl = captureSnapshot()
    if (!dataUrl) { setCaptureState('preview'); return }
    setSelfieDataUrl(dataUrl)
    setSelfieDescriptor(descriptor)
    setCaptureState('captured')
  }

  const handleCaptureId = () => {
    const dataUrl = captureSnapshot()
    if (!dataUrl) return
    setIdCardDataUrl(dataUrl)
    setCaptureState('captured')
  }

  const retake = () => {
    setCaptureState('preview')
    setErrorMsg(null)
    if (step === 'id_card') setIdCardDataUrl(null)
    else { setSelfieDataUrl(null); setSelfieDescriptor(null) }
  }

  const handleConfirmSelfie = () => {
    setStep('id_card')
    setCaptureState('preview')
    setErrorMsg(null)
  }

  const handleConfirmId = () => {
    if (selfieDescriptor && selfieDataUrl && idCardDataUrl) {
      onComplete({ descriptor: selfieDescriptor, selfieDataUrl, idCardDataUrl })
    }
  }

  const currentDataUrl = step === 'selfie' ? selfieDataUrl : idCardDataUrl

  return (
    <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 space-y-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Identity Verification</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {step === 'selfie'
            ? 'Step 1 of 2 — Capture your photo for periodic identity checks'
            : 'Step 2 of 2 — Show your ID card to the camera'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              selfieDescriptor
                ? 'bg-[var(--success)] text-white'
                : step === 'selfie'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
            }`}
          >
            {selfieDescriptor ? '✓' : '1'}
          </div>
          <div className="w-8 h-0.5 bg-[var(--border-subtle)]" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step === 'id_card'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
            }`}
          >
            2
          </div>
        </div>
      </div>

      {/* Camera feed / captured snapshot */}
      <div className="relative rounded-[var(--radius-md)] overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        {captureState === 'captured' && currentDataUrl ? (
          <img
            src={currentDataUrl}
            className="w-full h-full object-cover"
            alt="Captured frame"
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            autoPlay
            muted
            playsInline
          />
        )}
        {captureState === 'processing' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-sm font-medium animate-pulse">Detecting face…</span>
          </div>
        )}
      </div>

      {/* Instruction banner */}
      <div className="bg-[var(--accent-subtle)] border border-[var(--accent)]/30 rounded-[var(--radius-md)] p-3 text-sm text-[var(--accent-text)]">
        {step === 'selfie'
          ? '👤 Look straight at the camera with your face clearly visible and well-lit.'
          : '🪪 Hold your ID card up to the camera so the photo and name are clearly visible.'}
      </div>

      {/* Error / load states */}
      {faceApiLoadError && (
        <div className="bg-[var(--danger-subtle)] border border-[var(--danger)]/30 rounded-[var(--radius-md)] p-3 text-sm text-[var(--danger)]">
          ⚠ Face recognition models failed to load: {faceApiLoadError}
        </div>
      )}
      {errorMsg && (
        <div className="bg-[var(--danger-subtle)] border border-[var(--danger)]/30 rounded-[var(--radius-md)] p-3 text-sm text-[var(--danger)]">
          {errorMsg}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {(captureState === 'preview' || captureState === 'error') && (
          <>
            {!faceApiLoadError && (
              <button
                onClick={step === 'selfie' ? handleCaptureSelfie : handleCaptureId}
                disabled={step === 'selfie' && !faceApiReady}
                className="flex-1 py-2.5 bg-[var(--accent)] hover:opacity-90 disabled:bg-[var(--bg-elevated)] disabled:cursor-not-allowed text-white rounded-[var(--radius-md)] font-semibold transition"
              >
                {step === 'selfie'
                  ? faceApiReady
                    ? '📷 Capture Selfie'
                    : 'Loading face AI…'
                  : '📷 Capture ID Card'}
              </button>
            )}
          </>
        )}

        {captureState === 'captured' && (
          <>
            <button
              onClick={retake}
              className="px-4 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-sunken)] text-[var(--text-secondary)] rounded-[var(--radius-md)] text-sm font-medium transition"
            >
              ↩ Retake
            </button>
            <button
              onClick={step === 'selfie' ? handleConfirmSelfie : handleConfirmId}
              className="flex-1 py-2.5 bg-[var(--success)] hover:opacity-90 text-white rounded-[var(--radius-md)] font-semibold transition"
            >
              ✓ Looks Good
            </button>
          </>
        )}
      </div>
    </div>
  )
}
