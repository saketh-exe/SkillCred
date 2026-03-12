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
  onVerifyIdentity?: () => Promise<'match' | 'mismatch' | 'no_face'>
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
    setTimeout(() => setLastResult(null), 6000)
  }

  return (
    <>
      {/* Proctoring warning banner */}
      {activeWarning && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9997] bg-[var(--warning)] text-white px-5 py-2.5 text-sm font-bold shadow-[var(--shadow-lg)] rounded-[var(--radius-md)] whitespace-nowrap">
          ⚠️ Proctoring Alert: {activeWarning}
        </div>
      )}

      {/* Camera PiP — top-right corner */}
      <div className="fixed top-4 right-4 z-50 w-72 rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-lg)] border-2 border-[var(--border-default)] bg-[var(--bg-base)] select-none">
        <video
          ref={(el) => {
            if (videoRef) (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
            if (el && streamRef.current) attachStream(el, streamRef.current)
          }}
          className={['w-full block', status.streamActive ? '' : 'hidden'].join(' ')}
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          muted
          playsInline
        />
        {!status.streamActive && (
          <div className="w-full h-32 flex items-center justify-center bg-[var(--bg-sunken)]">
            {status.error ? (
              <span className="text-[var(--danger)] text-xs text-center px-2 leading-tight">{status.error}</span>
            ) : (
              <span className="text-[var(--text-tertiary)] text-xs">Starting camera…</span>
            )}
          </div>
        )}

        {/* AI models loading indicator */}
        {status.streamActive && !status.isReady && !status.error && (
          <div className="bg-[var(--accent-subtle)] px-2 py-1 text-xs text-[var(--accent-text)] text-center">
            Loading AI models…
          </div>
        )}

        {/* Status bar */}
        <div className="bg-[var(--bg-sunken)] px-3 py-2 flex items-center gap-3 text-base">
          <span
            title={`Faces detected: ${status.faceCount}`}
            className={['font-bold', faceOk ? 'text-[var(--success)]' : status.faceCount === 0 ? 'text-[var(--text-tertiary)]' : 'text-[var(--danger)]'].join(' ')}
          >
            👤 <span className="text-sm">{status.faceCount}</span>
          </span>

          <span
            title={`Gaze: ${status.gazeDirection}`}
            className={['text-lg', gazeOk ? 'text-[var(--success)]' : 'text-[var(--warning)]'].join(' ')}
          >
            {GAZE_ICON[status.gazeDirection]}
          </span>

          <span
            title={status.phoneDetected ? 'Phone detected!' : 'No phone'}
            className={['font-bold', phoneOk ? 'text-[var(--success)]' : 'text-[var(--danger)]'].join(' ')}
          >
            📱<span className="text-sm ml-0.5">{phoneOk ? '✓' : '⚠'}</span>
          </span>

          {violations.length > 0 && (
            <span className="ml-auto text-[var(--danger)] font-bold text-sm">
              ⚠️ {violations.length}
            </span>
          )}
        </div>

        {/* Label */}
        <div className="bg-[var(--bg-sunken)] px-2 py-0.5 text-center border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider">
            {status.isReady ? '● Monitoring' : '○ Proctoring'}
          </span>
        </div>

        {/* Manual identity verify button */}
        {onVerifyIdentity && hasReferenceIdentity && (
          <div className="bg-[var(--bg-sunken)] px-3 pb-3 pt-1 flex flex-col gap-1.5">
            <button
              onClick={handleVerify}
              disabled={verifying || !status.isReady}
              className="w-full py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {verifying ? 'Verifying…' : '🪪 Verify Identity'}
            </button>
            {lastResult && (
              <div
                className={[
                  'text-center text-xs font-bold py-1 rounded-[var(--radius-sm)]',
                  lastResult === 'match'
                    ? 'bg-[var(--success-subtle)] text-[var(--success)]'
                    : lastResult === 'no_face'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                    : 'bg-[var(--danger-subtle)] text-[var(--danger)]',
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
