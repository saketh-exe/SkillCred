import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { useProctoringMonitor } from '../../hooks/useProctoringMonitor'
import { ProctoringOverlay } from '../../components/ProctoringOverlay'
import { useFaceVerification, euclideanDistance, IDENTITY_MISMATCH_THRESHOLD } from '../../hooks/useFaceVerification'
import { IdentityCapture } from '../../components/IdentityCapture'
import { Button } from '../../components/ui'
import type { StudentLayoutContext } from './StudentLayout'
import type {
  AssessmentConfig, AssessmentData, AssessmentVerificationResult,
  AssessmentQuestion,
} from '../../types'

type QuestionState = 'unvisited' | 'answered' | 'skipped'
const MAX_TAB_LEAVES = 3

export default function PipelineAssessment() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const { setHideChrome } = useOutletContext<StudentLayoutContext>()

  const [config, setConfig] = useState<AssessmentConfig | null>(null)
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questionStatus, setQuestionStatus] = useState<Record<string, QuestionState>>({})
  const [sectionTimeLeft, setSectionTimeLeft] = useState(90)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [tabLeaveCount, setTabLeaveCount] = useState(0)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [verificationResult, setVerificationResult] = useState<AssessmentVerificationResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [autoSubmitMessage, setAutoSubmitMessage] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [terminated, setTerminated] = useState(false)
  const [proctoringEnabled, setProctoringEnabled] = useState(false)

  // Identity verification state
  const [showIdentityCapture, setShowIdentityCapture] = useState(false)
  const [selfieDescriptor, setSelfieDescriptor] = useState<Float32Array | null>(null)
  const [, setSelfieDataUrl] = useState<string | null>(null)
  const [, setIdCardDataUrl] = useState<string | null>(null)
  const [identityViolations, setIdentityViolations] = useState<
    { id: string; timestamp: number; distance: number; message: string }[]
  >([])

  const faceVerification = useFaceVerification()

  const {
    videoRef: proctoringVideoRef,
    streamRef: proctoringStreamRef,
    attachStream: proctoringAttachStream,
    status: proctoringStatus,
    violations: proctoringViolations,
    activeWarning: proctoringWarning,
    resetViolations: _resetProctoringViolations,
  } = useProctoringMonitor({
    enabled: proctoringEnabled,
    quizActive: quizStarted && !showResults && !terminated,
  })

  // Stable refs for use in event handlers
  const assessmentDataRef = useRef<AssessmentData | null>(null)
  const answersRef = useRef<Record<string, string>>({})
  const questionStatusRef = useRef<Record<string, QuestionState>>({})
  const currentSectionIdxRef = useRef(0)
  const showResultsRef = useRef(false)
  const tabLeaveCountRef = useRef(0)
  const lastLeaveTimeRef = useRef(0)
  const quizStartedRef = useRef(false)
  const terminatedRef = useRef(false)

  useEffect(() => { assessmentDataRef.current = assessmentData }, [assessmentData])
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { questionStatusRef.current = questionStatus }, [questionStatus])
  useEffect(() => { currentSectionIdxRef.current = currentSectionIdx }, [currentSectionIdx])
  useEffect(() => { quizStartedRef.current = quizStarted }, [quizStarted])

  // ── Hide sidebar & top nav while quiz is active ──
  useEffect(() => {
    if (quizStarted && !showResults && !terminated) {
      setHideChrome(true)
    } else {
      setHideChrome(false)
    }
    return () => setHideChrome(false)
  }, [quizStarted, showResults, terminated, setHideChrome])

  // ── Trap browser back button as a warning ──
  useEffect(() => {
    if (!quizStarted || showResults || terminated) return
    // Push a dummy history entry so pressing back doesn't leave the page
    window.history.pushState({ assessment: true }, '')
    const onPopState = () => {
      if (terminatedRef.current || showResultsRef.current) return
      // Re-push so we stay on the page
      window.history.pushState({ assessment: true }, '')
      // Count as a tab-leave warning
      const now = Date.now()
      if (now - lastLeaveTimeRef.current < 200) return
      lastLeaveTimeRef.current = now
      tabLeaveCountRef.current += 1
      const count = tabLeaveCountRef.current
      setTabLeaveCount(count)
      if (count >= MAX_TAB_LEAVES) {
        terminatedRef.current = true
        showResultsRef.current = true
        if (timerRef.current) clearInterval(timerRef.current)
        const localResult = scoreLocally(assessmentDataRef.current, answersRef.current)
        if (localResult) setVerificationResult(localResult)
        setTerminated(true)
      } else {
        setShowTabWarning(true)
        setTimeout(() => setShowTabWarning(false), 4000)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [quizStarted, showResults, terminated])

  // ── Load assessment config + generate questions ──
  useEffect(() => {
    if (!appId) return
    ;(async () => {
      try {
        setLoading(true)
        const cfg = await studentService.getAssessmentConfig(appId)
        setConfig(cfg)
        setSectionTimeLeft(cfg.timeLimitSeconds || 90)

        if (cfg.assessmentType === 'ai') {
          const result = await studentService.generateAssessment(appId)
          if (result.success) {
            setAssessmentData(result.data)
          } else {
            setError('Failed to generate questions')
          }
        } else {
          // Premade questions — convert to AssessmentData format
          const premade = cfg.premadeQuestions ?? []
          const questions: AssessmentQuestion[] = premade.map((q, i) => ({
            id: `premade_${i}`,
            skill: cfg.stageName,
            question: q.question,
            options: q.options,
            difficulty: 'intermediate' as const,
          }))
          const answerKey = premade.map((q, i) => ({
            questionId: `premade_${i}`,
            skill: cfg.stageName,
            correctAnswer: q.options[q.correctIndex],
            explanation: '',
          }))
          setAssessmentData({
            date: new Date().toISOString(),
            skills: [{ skill: cfg.stageName, questions, totalQuestions: questions.length }],
            totalQuestionsGenerated: questions.length,
            answerKey,
          })
        }

        if (cfg.proctoringEnabled) {
          setProctoringEnabled(true)
          setShowIdentityCapture(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment')
      } finally {
        setLoading(false)
      }
    })()
  }, [appId])

  // ── Submit assessment ──
  const submitAssessment = useCallback(async (autoMessage?: string) => {
    const data = assessmentDataRef.current
    if (!data || showResultsRef.current || !appId) return
    showResultsRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    const allIds = data.skills.flatMap(s => s.questions.map(q => q.id))
    const answerArray = allIds.map(id => ({
      questionId: id,
      selectedAnswer: answersRef.current[id] ?? '',
    }))

    setLoading(true)
    try {
      const result = await studentService.submitAssessmentForStage(appId, {
        answers: answerArray,
        answerKey: data.answerKey,
        report: {
          date: data.date,
          terminated: !!autoMessage,
          proctoringViolations: proctoringViolations.length,
          identityViolations: identityViolations.length,
        },
      })
      if (result.success) {
        if (autoMessage) setAutoSubmitMessage(autoMessage)
        setVerificationResult(result.data)
        setShowResults(true)
      } else {
        setError('Verification failed')
        if (!autoMessage) showResultsRef.current = false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
      if (!autoMessage) showResultsRef.current = false
    } finally {
      setLoading(false)
    }
  }, [appId, proctoringViolations, identityViolations])

  const advanceSection = useCallback((skipRemaining = false) => {
    const data = assessmentDataRef.current
    if (!data || showResultsRef.current) return
    const sIdx = currentSectionIdxRef.current
    if (skipRemaining) {
      setQuestionStatus(prev => {
        const updated = { ...prev }
        data.skills[sIdx].questions.forEach(q => {
          if (updated[q.id] === 'unvisited') updated[q.id] = 'skipped'
        })
        questionStatusRef.current = updated
        return updated
      })
    }
    const next = sIdx + 1
    if (next >= data.skills.length) {
      submitAssessment()
    } else {
      setCurrentSectionIdx(next)
      setCurrentQuestionIdx(0)
    }
  }, [submitAssessment])

  // Initialize quiz state when assessment data arrives
  useEffect(() => {
    if (!assessmentData) return
    const init: Record<string, QuestionState> = {}
    assessmentData.skills.forEach(s => s.questions.forEach(q => { init[q.id] = 'unvisited' }))
    setQuestionStatus(init)
    questionStatusRef.current = init
    setCurrentSectionIdx(0)
    setCurrentQuestionIdx(0)
    setTabLeaveCount(0)
    tabLeaveCountRef.current = 0
    showResultsRef.current = false
  }, [assessmentData])

  // Per-section countdown timer
  useEffect(() => {
    if (!assessmentData || showResults || !quizStarted || !config) return
    setSectionTimeLeft(config.timeLimitSeconds || 90)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimeout(() => advanceSection(true), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentSectionIdx, assessmentData, showResults, quizStarted, advanceSection, config])

  // Tab/app switch detection
  useEffect(() => {
    if (!assessmentData || !quizStarted) return
    const onLeave = () => {
      if (terminatedRef.current || showResultsRef.current) return
      const now = Date.now()
      if (now - lastLeaveTimeRef.current < 200) return
      lastLeaveTimeRef.current = now
      tabLeaveCountRef.current += 1
      const count = tabLeaveCountRef.current
      setTabLeaveCount(count)
      if (count >= MAX_TAB_LEAVES) {
        terminatedRef.current = true
        showResultsRef.current = true
        if (timerRef.current) clearInterval(timerRef.current)
        const localResult = scoreLocally(assessmentDataRef.current, answersRef.current)
        if (localResult) setVerificationResult(localResult)
        setTerminated(true)
      } else {
        setShowTabWarning(true)
        setTimeout(() => setShowTabWarning(false), 4000)
      }
    }
    const onVisibility = () => { if (document.hidden) onLeave() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onLeave)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onLeave)
    }
  }, [assessmentData, quizStarted])

  // Disable right-click/copy/paste during quiz
  useEffect(() => {
    if (!assessmentData || showResults) return
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('copy', prevent)
    document.addEventListener('cut', prevent)
    document.addEventListener('paste', prevent)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('copy', prevent)
      document.removeEventListener('cut', prevent)
      document.removeEventListener('paste', prevent)
    }
  }, [assessmentData, showResults])

  // Block nav keys
  useEffect(() => {
    if (!assessmentData || showResults) return
    const blockNavKeys = (e: KeyboardEvent) => {
      if (e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    const blockSwipe = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault()
    }
    window.addEventListener('keydown', blockNavKeys, { capture: true })
    window.addEventListener('wheel', blockSwipe, { passive: false, capture: true })
    return () => {
      window.removeEventListener('keydown', blockNavKeys, { capture: true })
      window.removeEventListener('wheel', blockSwipe, { capture: true })
    }
  }, [assessmentData, showResults])

  // Fullscreen enforcement
  useEffect(() => {
    const onFullscreenChange = () => {
      const quizActive = !!assessmentDataRef.current && quizStartedRef.current && !showResultsRef.current
      if (!document.fullscreenElement && quizActive) {
        setShowFullscreenOverlay(true)
      } else if (document.fullscreenElement) {
        setShowFullscreenOverlay(false)
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (showResults || terminated) setProctoringEnabled(false)
  }, [showResults, terminated])

  // Periodic identity check
  useEffect(() => {
    if (!quizStarted || showResults || terminated || !proctoringEnabled || !selfieDescriptor || !faceVerification.isReady) return
    const interval = setInterval(async () => {
      const video = proctoringVideoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return
      const descriptor = await faceVerification.extractDescriptor(video)
      if (!descriptor) return
      const distance = euclideanDistance(selfieDescriptor, descriptor)
      if (distance > IDENTITY_MISMATCH_THRESHOLD) {
        setIdentityViolations(prev => [...prev, {
          id: `identity-${Date.now()}`,
          timestamp: Date.now(),
          distance,
          message: `Face mismatch (distance: ${distance.toFixed(3)})`,
        }])
      }
    }, 90_000)
    return () => clearInterval(interval)
  }, [quizStarted, showResults, terminated, proctoringEnabled, selfieDescriptor, faceVerification.isReady, faceVerification.extractDescriptor])

  // Exit fullscreen when quiz ends
  useEffect(() => {
    if ((!assessmentData || !quizStarted || showResults) && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      setShowFullscreenOverlay(false)
    }
  }, [assessmentData, quizStarted, showResults])

  const handleReturnToFullscreen = () => {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      .then(() => setShowFullscreenOverlay(false))
      .catch(() => {})
  }

  const handleStartQuiz = () => {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
    setQuizStarted(true)
    quizStartedRef.current = true
    lastLeaveTimeRef.current = Date.now() + 1000
  }

  const handleAnswerSelect = (questionId: string, option: string) => {
    setAnswers(prev => { const u = { ...prev, [questionId]: option }; answersRef.current = u; return u })
    setQuestionStatus(prev => { const u = { ...prev, [questionId]: 'answered' as QuestionState }; questionStatusRef.current = u; return u })
  }

  const handleNext = () => {
    if (!assessmentData) return
    const section = assessmentData.skills[currentSectionIdx]
    if (currentQuestionIdx + 1 < section.questions.length) {
      setCurrentQuestionIdx(q => q + 1)
    } else {
      advanceSection(false)
    }
  }

  const handleSkip = () => {
    if (!assessmentData) return
    const qId = assessmentData.skills[currentSectionIdx].questions[currentQuestionIdx].id
    setAnswers(prev => { const u = { ...prev }; delete u[qId]; answersRef.current = u; return u })
    setQuestionStatus(prev => { const u = { ...prev, [qId]: 'skipped' as QuestionState }; questionStatusRef.current = u; return u })
    const section = assessmentData.skills[currentSectionIdx]
    if (currentQuestionIdx + 1 < section.questions.length) {
      setCurrentQuestionIdx(q => q + 1)
    } else {
      advanceSection(false)
    }
  }

  const goBack = () => navigate('/student/applications')

  const currentSection = assessmentData?.skills[currentSectionIdx]
  const currentQuestion = currentSection?.questions[currentQuestionIdx]
  const isLastInQuiz = assessmentData != null && currentSectionIdx === assessmentData.skills.length - 1 && currentQuestionIdx === (currentSection?.totalQuestions ?? 1) - 1
  const isLastInSection = assessmentData != null && currentQuestionIdx === (currentSection?.totalQuestions ?? 1) - 1
  const mins = Math.floor(sectionTimeLeft / 60)
  const secs = sectionTimeLeft % 60
  const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`
  const timerUrgent = sectionTimeLeft <= 20
  const timerWarn = !timerUrgent && sectionTimeLeft <= 45

  // ── Loading state ──
  if (loading && !assessmentData) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)]">Preparing your assessment…</p>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error && !assessmentData) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-6">
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Unable to Load Assessment</h2>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <Button onClick={goBack}>Back to Applications</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-6">
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] p-8 max-w-md w-full space-y-5">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Exit Assessment?</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              If you exit now, your <strong>progress will be lost</strong> and the assessment will be
              marked as <strong>incomplete</strong>.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[var(--text-primary)] rounded-[var(--radius-md)] font-semibold transition"
              >
                Continue Assessment
              </button>
              <button
                onClick={() => {
                  submitAssessment('Assessment exited early by candidate')
                }}
                className="flex-1 py-2.5 bg-[var(--danger)] hover:opacity-90 text-white rounded-[var(--radius-md)] font-semibold transition"
              >
                Exit & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen enforcement overlay */}
      {showFullscreenOverlay && !terminated && (
        <div className="fixed inset-0 z-[9999] bg-[var(--bg-overlay)]/95 flex flex-col items-center justify-center gap-6 text-center px-6">
          <div className="text-6xl">⛔</div>
          <h2 className="text-2xl font-bold text-white">Fullscreen Required</h2>
          <p className="text-gray-300 max-w-sm">
            This assessment must be taken in fullscreen mode.
          </p>
          <p className="text-sm text-[var(--danger)]">
            Warnings: {tabLeaveCount}/{MAX_TAB_LEAVES}
          </p>
          <button
            onClick={handleReturnToFullscreen}
            className="mt-2 px-8 py-4 bg-[var(--accent)] hover:opacity-90 text-white text-lg font-bold rounded-[var(--radius-lg)] transition shadow-[var(--shadow-xl)]"
          >
            🔲 Return to Fullscreen
          </button>
        </div>
      )}

      {showTabWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--danger)] text-white text-center py-3 text-sm font-bold animate-pulse shadow-[var(--shadow-lg)]">
          ⚠ Warning: You left the assessment window! ({tabLeaveCount}/{MAX_TAB_LEAVES} warnings)
        </div>
      )}

      <ProctoringOverlay
        videoRef={proctoringVideoRef}
        streamRef={proctoringStreamRef}
        attachStream={proctoringAttachStream}
        status={proctoringStatus}
        violations={proctoringViolations}
        activeWarning={proctoringWarning}
        enabled={proctoringEnabled}
        hasReferenceIdentity={!!selfieDescriptor}
        onVerifyIdentity={selfieDescriptor ? async () => {
          const video = proctoringVideoRef.current
          if (!video || video.readyState < 2) return 'no_face'
          const descriptor = await faceVerification.extractDescriptor(video)
          if (!descriptor) return 'no_face'
          const dist = euclideanDistance(selfieDescriptor, descriptor)
          const result = dist <= IDENTITY_MISMATCH_THRESHOLD ? 'match' : 'mismatch'
          if (result === 'mismatch') {
            setIdentityViolations(prev => [...prev, {
              id: `identity-manual-${Date.now()}`,
              timestamp: Date.now(),
              distance: dist,
              message: `Manual check: face mismatch (distance: ${dist.toFixed(3)})`,
            }])
          }
          return result
        } : undefined}
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        {config && !quizStarted && !terminated && !showResults && (
          <div className="mb-4">
            <button onClick={goBack} className="text-sm text-[var(--accent)] hover:underline mb-2 inline-block">
              ← Back to Applications
            </button>
          </div>
        )}

        <h1 className="text-[28px] font-bold mb-6 text-center text-[var(--text-primary)] font-[var(--font-heading)]">
          {config?.stageName ?? 'Online Assessment'}
        </h1>

        {terminated ? (
          /* ── TERMINATED SCREEN ── */
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-8 space-y-6 text-center">
            <div className="text-6xl">🚫</div>
            <h2 className="text-2xl font-bold text-[var(--danger)]">Assessment Terminated</h2>
            <p className="text-[var(--text-secondary)]">
              You exceeded the maximum allowed violations ({MAX_TAB_LEAVES}).
            </p>
            {verificationResult && (
              <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4">
                <p className="font-[var(--font-mono)] text-lg">Score: {verificationResult.score}%</p>
              </div>
            )}
            <Button onClick={goBack}>Back to Applications</Button>
          </div>
        ) : showIdentityCapture ? (
          /* ── IDENTITY CAPTURE SCREEN ── */
          <IdentityCapture
            streamRef={proctoringStreamRef}
            faceApiReady={faceVerification.isReady}
            faceApiLoadError={faceVerification.loadError}
            extractDescriptor={faceVerification.extractDescriptor}
            onComplete={({ descriptor, selfieDataUrl: sdu, idCardDataUrl: idu }) => {
              setSelfieDescriptor(descriptor)
              setSelfieDataUrl(sdu)
              setIdCardDataUrl(idu)
              setShowIdentityCapture(false)
            }}
          />
        ) : assessmentData && !quizStarted ? (
          /* ── READY TO BEGIN SCREEN ── */
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-8 space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Ready to Begin?</h2>
              <p className="text-[var(--text-tertiary)] text-sm mt-1">
                {assessmentData.skills.length} section{assessmentData.skills.length !== 1 ? 's' : ''} · {assessmentData.totalQuestionsGenerated} questions · {config?.timeLimitSeconds ?? 90}s per section
              </p>
            </div>

            <div className="bg-[var(--warning-subtle)] border border-[var(--warning)]/30 rounded-[var(--radius-md)] p-4 text-left text-sm space-y-1.5 text-[var(--warning)]">
              <p className="font-semibold mb-2 text-[var(--text-primary)]">Assessment Rules</p>
              <p>The assessment will run in <strong>full screen</strong>.</p>
              <p>Switching tabs or apps is detected. <strong>3 violations = auto-terminate.</strong></p>
              <p>Each section has a <strong>{config?.timeLimitSeconds ?? 90}-second timer</strong>.</p>
              <p>Right-click, copy, paste, and navigation are <strong>disabled</strong>.</p>
              {proctoringEnabled && <p>Camera monitoring and identity verification are <strong>required</strong>.</p>}
            </div>

            {proctoringEnabled && !proctoringStatus.isReady && !proctoringStatus.error && (
              <p className="text-xs text-center text-[var(--accent)]">Loading camera & AI models…</p>
            )}

            {proctoringEnabled && (
              <div className="flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 text-left">
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">🧑‍💻 Identity Capture</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Face-match verification during the assessment</p>
                </div>
                {selfieDescriptor ? (
                  <span className="ml-4 shrink-0 text-[var(--success)] font-semibold text-sm">✓ Captured</span>
                ) : (
                  <span className="ml-4 shrink-0 text-[var(--warning)] font-semibold text-sm">⚠ Required</span>
                )}
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              disabled={proctoringEnabled && !selfieDescriptor}
              className="w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--bg-elevated)] disabled:cursor-not-allowed text-white text-lg font-bold rounded-[var(--radius-lg)] transition shadow-[var(--shadow-md)]"
            >
              {proctoringEnabled && !selfieDescriptor ? 'Complete Identity Capture to Continue' : 'Enter Fullscreen & Start Assessment'}
            </button>
          </div>
        ) : assessmentData && !showResults ? (
          /* ── QUIZ SCREEN ── */
          <div className="space-y-4">
            {/* Question navigator bar */}
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-4">
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  {assessmentData.skills.map((section, sIdx) => (
                    <div key={section.skill} className="flex flex-col items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate max-w-[72px] text-center ${
                          sIdx === currentSectionIdx ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                        }`}
                        title={section.skill}
                      >
                        {section.skill}
                      </span>
                      <div className="flex gap-1">
                        {section.questions.map((q, qIdx) => {
                          const qs = questionStatus[q.id] ?? 'unvisited'
                          const isCurrent = sIdx === currentSectionIdx && qIdx === currentQuestionIdx
                          return (
                            <div
                              key={q.id}
                              className={[
                                'w-7 h-7 flex items-center justify-center rounded text-white text-xs font-bold',
                                qs === 'answered' ? 'bg-[var(--success)]' : qs === 'skipped' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]',
                                isCurrent ? 'ring-2 ring-offset-1 ring-[var(--accent)] scale-110' : '',
                              ].join(' ')}
                            >
                              {qIdx + 1}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-5 mt-3 pt-3 border-t border-[var(--border-subtle)]">
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                  <span className="w-3 h-3 rounded bg-[var(--warning)] inline-block" /> Not visited
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                  <span className="w-3 h-3 rounded bg-[var(--success)] inline-block" /> Answered
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                  <span className="w-3 h-3 rounded bg-[var(--danger)] inline-block" /> Skipped
                </span>
              </div>
            </div>

            {/* Section header + timer */}
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{currentSection?.skill}</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Question {currentQuestionIdx + 1} of {currentSection?.totalQuestions} · Section {currentSectionIdx + 1} of {assessmentData.skills.length}
                </p>
              </div>
              <div className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border text-xs font-semibold shrink-0',
                tabLeaveCount > 0
                  ? 'bg-[var(--danger-subtle)] border-[var(--danger)]/30 text-[var(--danger)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)]',
              ].join(' ')}>
                ⚠️ {tabLeaveCount}/{MAX_TAB_LEAVES}
              </div>
              <div className={[
                'px-4 py-2 rounded-[var(--radius-md)] border-2 font-[var(--font-mono)] text-2xl font-bold shrink-0',
                timerUrgent
                  ? 'bg-[var(--danger-subtle)] border-[var(--danger)] text-[var(--danger)] animate-pulse'
                  : timerWarn
                  ? 'bg-[var(--warning-subtle)] border-[var(--warning)] text-[var(--warning)]'
                  : 'bg-[var(--success-subtle)] border-[var(--success)] text-[var(--success)]',
              ].join(' ')}>
                {timerStr}
              </div>
              <button
                onClick={() => setShowExitConfirm(true)}
                className="px-3 py-1.5 bg-[var(--danger-subtle)] hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/30 rounded-[var(--radius-md)] text-xs font-semibold shrink-0 transition"
              >
                Exit Test
              </button>
            </div>

            {/* Question card */}
            {currentQuestion && (
              <div className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
                <div className="flex justify-between items-start mb-5">
                  <p className="text-lg font-medium text-[var(--text-primary)] flex-1 pr-4 leading-relaxed select-none">
                    {currentQuestion.question}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-elevated)] text-[var(--text-tertiary)] shrink-0">
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, oIdx) => (
                    <label
                      key={oIdx}
                      className={[
                        'flex items-center gap-3 cursor-pointer p-3.5 rounded-[var(--radius-sm)] border-2 transition select-none',
                        answers[currentQuestion.id] === option
                          ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--accent)]/50',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                        className="w-4 h-4 accent-[var(--accent)]"
                      />
                      <span className="text-[var(--text-primary)]">{option}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[var(--text-secondary)] rounded-[var(--radius-md)] font-semibold transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id] || loading}
                    className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--bg-elevated)] disabled:cursor-not-allowed text-white rounded-[var(--radius-md)] font-semibold transition"
                  >
                    {loading
                      ? 'Submitting…'
                      : isLastInQuiz
                      ? 'Submit Assessment'
                      : isLastInSection
                      ? 'Next Section →'
                      : 'Next →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : verificationResult ? (
          /* ── RESULTS SCREEN ── */
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 space-y-6">
            {autoSubmitMessage && (
              <div className="bg-[var(--danger-subtle)] border border-[var(--danger)]/30 p-4 rounded-[var(--radius-md)] font-medium text-[var(--danger)] text-sm">
                ⚠ {autoSubmitMessage}
              </div>
            )}

            <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white p-6 rounded-[var(--radius-lg)] text-center">
              <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
              <div className="text-5xl font-bold font-[var(--font-mono)] mb-2">{verificationResult.score}%</div>
              <p className="text-lg">
                {verificationResult.correctAnswers} out of {verificationResult.totalQuestions} correct
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[var(--success-subtle)] p-4 rounded-[var(--radius-md)] text-center">
                <p className="text-2xl font-bold text-[var(--success)]">{verificationResult.correctAnswers}</p>
                <p className="text-sm text-[var(--text-secondary)]">Correct</p>
              </div>
              <div className="bg-[var(--danger-subtle)] p-4 rounded-[var(--radius-md)] text-center">
                <p className="text-2xl font-bold text-[var(--danger)]">{verificationResult.wrongAnswers}</p>
                <p className="text-sm text-[var(--text-secondary)]">Wrong</p>
              </div>
              <div className="bg-[var(--accent-subtle)] p-4 rounded-[var(--radius-md)] text-center">
                <p className="text-2xl font-bold text-[var(--accent)]">{verificationResult.totalQuestions}</p>
                <p className="text-sm text-[var(--text-secondary)]">Total</p>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Detailed Results</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {verificationResult.results.map((result, index) => (
                  <div
                    key={result.questionId}
                    className={`p-4 rounded-[var(--radius-sm)] border-l-4 ${
                      result.isCorrect
                        ? 'border-[var(--success)] bg-[var(--success-subtle)]'
                        : 'border-[var(--danger)] bg-[var(--danger-subtle)]'
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-[var(--text-primary)]">
                        Q{index + 1} — {result.skill}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        result.isCorrect
                          ? 'bg-[var(--success)]/20 text-[var(--success)]'
                          : 'bg-[var(--danger)]/20 text-[var(--danger)]'
                      }`}>
                        {result.isCorrect ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      <strong>Your answer:</strong> {result.selectedAnswer || '(no answer)'}
                    </p>
                    {!result.isCorrect && (
                      <p className="text-sm text-[var(--text-secondary)] mb-1">
                        <strong>Correct:</strong> {result.correctAnswer}
                      </p>
                    )}
                    <p className="text-sm text-[var(--text-tertiary)]">
                      <strong>Explanation:</strong> {result.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={goBack} className="w-full">
              Back to Applications
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function scoreLocally(
  data: AssessmentData | null,
  answers: Record<string, string>,
): AssessmentVerificationResult | null {
  if (!data) return null
  const results = data.answerKey.map(ak => {
    const selected = answers[ak.questionId] ?? ''
    return {
      questionId: ak.questionId,
      skill: ak.skill,
      isCorrect: selected !== '' && selected === ak.correctAnswer,
      correctAnswer: ak.correctAnswer,
      selectedAnswer: selected,
      explanation: ak.explanation,
    }
  })
  const correctAnswers = results.filter(r => r.isCorrect).length
  const totalQuestions = results.length
  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers: totalQuestions - correctAnswers,
    score: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    results,
  }
}
