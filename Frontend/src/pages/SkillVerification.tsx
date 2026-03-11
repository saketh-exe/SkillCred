
import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { Api } from '../hooks/useApi'
import { useQuiz } from '../context/QuizContext'
import { useProctoringMonitor } from '../hooks/useProctoringMonitor'
import type { ProctoringViolation } from '../hooks/useProctoringMonitor'
import { ProctoringOverlay } from '../components/ProctoringOverlay'

interface Question {
  id: string
  skill: string
  question: string
  options: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface SkillAssessmentData {
  candidateName?: string
  date: string
  skills: { skill: string; questions: Question[]; totalQuestions: number }[]
  totalQuestionsGenerated: number
  answerKey: { questionId: string; skill: string; correctAnswer: string; explanation: string }[]
}

interface VerificationResult {
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  score: number
  results: {
    questionId: string
    skill: string
    isCorrect: boolean
    correctAnswer: string
    selectedAnswer: string
    explanation: string
  }[]
}

interface SkillsData {
  github?: { username?: string; url?: string }
  skills: string[]
  projects?: { name: string; technologies: string[] }[]
  internships?: { company: string; role: string; duration: string; description: string }[]
}

type QuestionState = 'unvisited' | 'answered' | 'skipped'

const SECTION_TIME_SECONDS = 90
const MAX_TAB_LEAVES = 3

export default function SkillVerificationPage({ api }: { api: Api }) {
  const [assessmentData, setAssessmentData] = useState<SkillAssessmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questionStatus, setQuestionStatus] = useState<Record<string, QuestionState>>({})
  const [sectionTimeLeft, setSectionTimeLeft] = useState(SECTION_TIME_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [tabLeaveCount, setTabLeaveCount] = useState(0)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [autoSubmitMessage, setAutoSubmitMessage] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [terminated, setTerminated] = useState(false)
  const [proctoringEnabled, setProctoringEnabled] = useState(false)

  const { setQuizActive } = useQuiz()

  const {
    videoRef: proctoringVideoRef,
    streamRef: proctoringStreamRef,
    attachStream: proctoringAttachStream,
    status: proctoringStatus,
    violations: proctoringViolations,
    activeWarning: proctoringWarning,
    violationCount: proctoringViolationCount,
    resetViolations: resetProctoringViolations,
  } = useProctoringMonitor({
    enabled: proctoringEnabled,
    quizActive: quizStarted && !showResults && !terminated,
  })

  const assessmentDataRef = useRef<SkillAssessmentData | null>(null)
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

  const submitAssessment = useCallback(async (autoMessage?: string) => {
    const data = assessmentDataRef.current
    if (!data || showResultsRef.current) return
    showResultsRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    const allIds = data.skills.flatMap((s) => s.questions.map((q) => q.id))
    const answerArray = allIds.map((id) => ({
      questionId: id,
      selectedAnswer: answersRef.current[id] ?? '',
    }))
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/assessments/skills/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray, answerKey: data.answerKey }),
      })
      const result = await res.json()
      if (result.success) {
        if (autoMessage) setAutoSubmitMessage(autoMessage)
        setVerificationResult(result.data)
        setShowResults(true)
      } else {
        setError(result.message || 'Verification failed')
        // Only allow retry on manual submit; auto-submit ends the quiz regardless
        if (!autoMessage) showResultsRef.current = false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify')
      // Only allow retry on manual submit; auto-submit ends the quiz regardless
      if (!autoMessage) showResultsRef.current = false
    } finally {
      setLoading(false)
    }
  }, [])

  const advanceSection = useCallback(
    (skipRemaining = false) => {
      const data = assessmentDataRef.current
      if (!data || showResultsRef.current) return
      const sIdx = currentSectionIdxRef.current
      if (skipRemaining) {
        setQuestionStatus((prev) => {
          const updated = { ...prev }
          data.skills[sIdx].questions.forEach((q) => {
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
    },
    [submitAssessment],
  )

  // Initialize quiz state when assessment data arrives
  useEffect(() => {
    if (!assessmentData) return
    const init: Record<string, QuestionState> = {}
    assessmentData.skills.forEach((s) => s.questions.forEach((q) => { init[q.id] = 'unvisited' }))
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
    if (!assessmentData || showResults || !quizStarted) return
    setSectionTimeLeft(SECTION_TIME_SECONDS)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSectionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimeout(() => advanceSection(true), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentSectionIdx, assessmentData, showResults, quizStarted, advanceSection])

  // Detect focus loss: tab-switch (visibilitychange) + alt-tab / app-switch (window blur)
  useEffect(() => {
    if (!assessmentData || !quizStarted) return
    const onLeave = () => {
      if (terminatedRef.current || showResultsRef.current) return
      // Deduplicate: blur + visibilitychange can both fire for the same gesture
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

  // Disable right-click / copy / cut / paste during quiz
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

  // Block browser back/forward gestures (Cmd+Left / Cmd+Right) during quiz
  // and intercept Escape to re-enter fullscreen instead of exiting
  useEffect(() => {
    if (!assessmentData || showResults) return
    const blockNavKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quizStarted && !showResultsRef.current) {
        // Cannot preventDefault Escape in fullscreen — browser ignores it by design.
        // fullscreenchange handler above will re-enter fullscreen after the browser exits.
        return
      }
      if (e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    // Block two-finger horizontal swipe (trackpad/touch) back/forward navigation.
    // The browser only triggers history navigation when the page hits its horizontal
    // scroll limit, so capturing wheel events with a dominant deltaX and preventing
    // default stops the gesture from being interpreted as navigation.
    const blockSwipe = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', blockNavKeys, { capture: true })
    window.addEventListener('wheel', blockSwipe, { passive: false, capture: true })
    return () => {
      window.removeEventListener('keydown', blockNavKeys, { capture: true })
      window.removeEventListener('wheel', blockSwipe, { capture: true })
    }
  }, [assessmentData, showResults, quizStarted])

  // Stable ref so the fullscreenchange handler always sees current quiz state.
  // Uses only refs — no dependency on React's render cycle — so it's always accurate
  // even mid-async-operation (e.g. while submitAssessment fetch is in-flight).
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

  // Stop camera when quiz ends (normal completion, termination, or reset)
  useEffect(() => {
    if (showResults || terminated) setProctoringEnabled(false)
  }, [showResults, terminated])

  // Exit fullscreen when quiz ends
  useEffect(() => {
    if ((!assessmentData || !quizStarted || showResults) && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      setShowFullscreenOverlay(false)
    }
  }, [assessmentData, quizStarted, showResults])

  const handleReturnToFullscreen = () => {
    document.documentElement
      .requestFullscreen({ navigationUI: 'hide' })
      .then(() => setShowFullscreenOverlay(false))
      .catch(() => {})
  }

  const handleStartQuiz = () => {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
    setQuizStarted(true)
    quizStartedRef.current = true
    setQuizActive(true)
    lastLeaveTimeRef.current = Date.now() + 1000
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      setError(null)
      const parsed: SkillsData = JSON.parse(await file.text())
      if (!parsed.skills || !Array.isArray(parsed.skills)) {
        setError('Invalid JSON: missing "skills" array.')
        return
      }
      const techs = [...new Set((parsed.projects ?? []).flatMap((p) => p.technologies ?? []))]
      await generateQuestions({
        candidateName: parsed.github?.username,
        skills: parsed.skills,
        technologies: techs,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file')
    } finally {
      setLoading(false)
    }
  }

  const generateQuestions = async (data: {
    candidateName?: string
    skills: string[]
    technologies: string[]
  }) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('http://localhost:3000/api/assessments/skills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, numQuestionsPerSkill: 3 }),
      })
      const result = await res.json()
      if (result.success) {
        setAssessmentData(result.data)
        setAnswers({})
        answersRef.current = {}
        setVerificationResult(null)
        setShowResults(false)
        setAutoSubmitMessage(null)
      } else {
        setError(result.message || 'Failed to generate questions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const u = { ...prev, [questionId]: option }
      answersRef.current = u
      return u
    })
    setQuestionStatus((prev) => {
      const u = { ...prev, [questionId]: 'answered' as QuestionState }
      questionStatusRef.current = u
      return u
    })
  }

  const handleNext = () => {
    if (!assessmentData) return
    const section = assessmentData.skills[currentSectionIdx]
    if (currentQuestionIdx + 1 < section.questions.length) {
      setCurrentQuestionIdx((q) => q + 1)
    } else {
      advanceSection(false)
    }
  }

  const handleSkip = () => {
    if (!assessmentData) return
    const qId = assessmentData.skills[currentSectionIdx].questions[currentQuestionIdx].id
    setAnswers((prev) => {
      const u = { ...prev }
      delete u[qId]
      answersRef.current = u
      return u
    })
    setQuestionStatus((prev) => {
      const u = { ...prev, [qId]: 'skipped' as QuestionState }
      questionStatusRef.current = u
      return u
    })
    const section = assessmentData.skills[currentSectionIdx]
    if (currentQuestionIdx + 1 < section.questions.length) {
      setCurrentQuestionIdx((q) => q + 1)
    } else {
      advanceSection(false)
    }
  }

  const resetAssessment = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    showResultsRef.current = false
    tabLeaveCountRef.current = 0
    lastLeaveTimeRef.current = 0
    setAssessmentData(null)
    setAnswers({})
    setQuestionStatus({})
    setVerificationResult(null)
    setShowResults(false)
    setError(null)
    setCurrentSectionIdx(0)
    setCurrentQuestionIdx(0)
    setTabLeaveCount(0)
    setAutoSubmitMessage(null)
    setTerminated(false)
    terminatedRef.current = false
    resetProctoringViolations()
    setProctoringEnabled(false)
    setShowTabWarning(false)
    setQuizStarted(false)
    quizStartedRef.current = false
    setShowFullscreenOverlay(false)
    setShowExitConfirm(false)
    setQuizActive(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const currentSection = assessmentData?.skills[currentSectionIdx]
  const currentQuestion = currentSection?.questions[currentQuestionIdx]
  const isLastInQuiz =
    assessmentData != null &&
    currentSectionIdx === assessmentData.skills.length - 1 &&
    currentQuestionIdx === (currentSection?.totalQuestions ?? 1) - 1
  const isLastInSection =
    assessmentData != null && currentQuestionIdx === (currentSection?.totalQuestions ?? 1) - 1
  const mins = Math.floor(sectionTimeLeft / 60)
  const secs = sectionTimeLeft % 60
  const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`
  const timerUrgent = sectionTimeLeft <= 20
  const timerWarn = !timerUrgent && sectionTimeLeft <= 45

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Exit Assessment?</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              If you exit now, your <strong>progress will be lost</strong> and the assessment will be
              marked as <strong>incomplete</strong>. You will need to start over from the beginning.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition"
              >
                Continue Assessment
              </button>
              <button
                onClick={() => {
                  const local = scoreLocally(assessmentData, answers)
                  if (local) {
                    downloadJSON(
                      buildReport(
                        assessmentData,
                        local,
                        assessmentData?.candidateName,
                        true,
                        proctoringEnabled,
                        proctoringViolations,
                      ),
                      assessmentData?.candidateName,
                    )
                  }
                  resetAssessment()
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Exit &amp; Download Report
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen enforcement overlay — shown when user exits fullscreen during quiz */}
      {showFullscreenOverlay && !terminated && (
        <div className="fixed inset-0 z-[9999] bg-gray-950/95 flex flex-col items-center justify-center gap-6 text-center px-6">
          <div className="text-6xl">⛔</div>
          <h2 className="text-2xl font-bold text-white">Fullscreen Required</h2>
          <p className="text-gray-300 max-w-sm">
            This assessment must be taken in fullscreen mode. You exited fullscreen — please return to continue.
          </p>
          <p className="text-sm text-red-400">
            Leaving fullscreen is recorded as a violation. Current warnings: {tabLeaveCount}/{MAX_TAB_LEAVES}
          </p>
          <button
            onClick={handleReturnToFullscreen}
            className="mt-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold rounded-xl transition shadow-xl"
          >
            🔲 Return to Fullscreen
          </button>
        </div>
      )}

      {showTabWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-3 text-sm font-bold animate-pulse shadow-lg">
          &#9888; Warning: You left the assessment window! ({tabLeaveCount}/{MAX_TAB_LEAVES} warnings)
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
      />

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Skill Verification Assessment
        </h1>

        {terminated ? (
          /* ── TERMINATED SCREEN ── */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6 text-center">
            <div className="text-6xl">🚫</div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Assessment Terminated</h2>
            <p className="text-gray-600 dark:text-gray-300">
              You exceeded the maximum allowed violations ({MAX_TAB_LEAVES}). The assessment has been closed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetAssessment}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition"
              >
                Start Over
              </button>
              {verificationResult ? (
                <button
                  onClick={() => downloadJSON(
                    buildReport(assessmentData, verificationResult, assessmentData?.candidateName, true, proctoringEnabled, proctoringViolations),
                    assessmentData?.candidateName,
                  )}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition"
                >
                  Download Report
                </button>
              ) : (
                <button disabled className="flex-1 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 rounded-xl font-bold cursor-not-allowed">
                  Report Unavailable
                </button>
              )}
            </div>
          </div>
        ) : !assessmentData ? (
          /* ── SETUP SCREEN ── */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Upload Skills JSON File</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  {loading ? 'Generating questions...' : 'Choose JSON File'}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  JSON should contain a "skills" array
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 p-4 rounded-lg text-sm">
              <p className="font-semibold mb-1">API Key Setup</p>
              <p>Add your Gemini API key to <code>Backend/.env</code>:</p>
              <pre className="mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                GEMINI_API_KEY=your_key_here
              </pre>
            </div>
          </div>
        ) : !quizStarted ? (
          /* ── READY TO BEGIN SCREEN ── */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                Ready to Begin?
              </h2>
              {assessmentData.candidateName && (
                <p className="text-gray-500 text-sm">Candidate: <strong>{assessmentData.candidateName}</strong></p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {assessmentData.skills.length} skill{assessmentData.skills.length !== 1 ? 's' : ''} &middot; {assessmentData.totalQuestionsGenerated} questions &middot; {SECTION_TIME_SECONDS}s per section
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 text-left text-sm space-y-1.5 text-yellow-900 dark:text-yellow-200">
              <p className="font-semibold mb-2">Assessment Rules</p>
              <p>The assessment will run in <strong>full screen</strong>. Exiting fullscreen will force you back in.</p>
              <p>Switching tabs or apps is detected. <strong>3 violations = auto-terminate.</strong></p>
              <p>Each section has a <strong>{SECTION_TIME_SECONDS}-second timer</strong>. Unanswered questions are skipped when time runs out.</p>
              <p>Right-click, copy, paste, and back/forward navigation are <strong>disabled</strong>.</p>
            </div>

            {/* Camera monitoring toggle */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-left">
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white">📷 Camera Monitoring <span className="text-xs font-normal text-gray-400 ml-1">(Optional)</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Webcam AI monitors for multiple people, gaze direction &amp; phone use</p>
              </div>
              <button
                onClick={() => setProctoringEnabled(v => !v)}
                className={[
                  'ml-4 px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0',
                  proctoringEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200',
                ].join(' ')}
              >
                {proctoringEnabled ? '✓ Enabled' : 'Enable'}
              </button>
            </div>
            {proctoringEnabled && !proctoringStatus.isReady && !proctoringStatus.error && (
              <p className="text-xs text-center text-blue-500">Loading camera &amp; AI models…</p>
            )}
            {proctoringEnabled && proctoringStatus.error && (
              <p className="text-xs text-center text-red-500">⚠ {proctoringStatus.error}</p>
            )}

            <button
              onClick={handleStartQuiz}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl transition shadow-lg"
            >
              Enter Fullscreen &amp; Start Assessment
            </button>
          </div>
        ) : !showResults ? (
          /* ── QUIZ SCREEN ── */
          <div className="space-y-4">
            {/* Question navigator bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  {assessmentData.skills.map((section, sIdx) => (
                    <div key={section.skill} className="flex flex-col items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate max-w-[72px] text-center ${
                          sIdx === currentSectionIdx ? 'text-blue-500' : 'text-gray-400'
                        }`}
                        title={section.skill}
                      >
                        {section.skill}
                      </span>
                      <div className="flex gap-1">
                        {section.questions.map((q, qIdx) => {
                          const status = questionStatus[q.id] ?? 'unvisited'
                          const isCurrent =
                            sIdx === currentSectionIdx && qIdx === currentQuestionIdx
                          return (
                            <div
                              key={q.id}
                              className={[
                                'w-7 h-7 flex items-center justify-center rounded text-white text-xs font-bold',
                                status === 'answered'
                                  ? 'bg-green-500'
                                  : status === 'skipped'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-400',
                                isCurrent ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : '',
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
              <div className="flex gap-5 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Not visited
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Answered
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Skipped
                </span>
              </div>
            </div>

            {/* Section header + timer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {currentSection?.skill}
                </h2>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIdx + 1} of {currentSection?.totalQuestions} &middot;
                  Section {currentSectionIdx + 1} of {assessmentData.skills.length}
                </p>
              </div>
              {/* Warnings badge */}
              <div className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0',
                tabLeaveCount > 0
                  ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/40 dark:border-red-600 dark:text-red-300'
                  : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600',
              ].join(' ')}>
                <span>⚠️</span>
                <span>Warnings: {tabLeaveCount}/{MAX_TAB_LEAVES}</span>
              </div>
              <div
                className={[
                  'px-4 py-2 rounded-lg border-2 font-mono text-2xl font-bold shrink-0',
                  timerUrgent
                    ? 'bg-red-50 border-red-400 text-red-500 animate-pulse'
                    : timerWarn
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-500'
                    : 'bg-green-50 border-green-400 text-green-500',
                ].join(' ')}
              >
                {timerStr}
              </div>
              {/* Exit button */}
              <button
                onClick={() => setShowExitConfirm(true)}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/70 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg text-xs font-semibold shrink-0 transition"
              >
                Exit Test
              </button>
            </div>

            {/* Question card */}
            {currentQuestion && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-5">
                  <p className="text-lg font-medium text-gray-800 dark:text-white flex-1 pr-4 leading-relaxed select-none">
                    {currentQuestion.question}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 shrink-0">
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, oIdx) => (
                    <label
                      key={oIdx}
                      className={[
                        'flex items-center gap-3 cursor-pointer p-3.5 rounded-lg border-2 transition select-none',
                        answers[currentQuestion.id] === option
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id] || loading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                  >
                    {loading
                      ? 'Submitting...'
                      : isLastInQuiz
                      ? 'Submit Assessment'
                      : isLastInSection
                      ? 'Next Section \u2192'
                      : 'Next \u2192'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : verificationResult ? (
          /* ── RESULTS SCREEN ── */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            {autoSubmitMessage && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-300 text-red-800 dark:text-red-100 p-4 rounded-lg font-medium">
                &#9888; {autoSubmitMessage}
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
              <div className="text-5xl font-bold mb-2">{verificationResult.score}%</div>
              <p className="text-lg">
                {verificationResult.correctAnswers} out of {verificationResult.totalQuestions} correct
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{verificationResult.correctAnswers}</p>
                <p className="text-sm">Correct</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{verificationResult.wrongAnswers}</p>
                <p className="text-sm">Wrong</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{verificationResult.totalQuestions}</p>
                <p className="text-sm">Total</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Detailed Results</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {verificationResult.results.map((result, index) => (
                  <div
                    key={result.questionId}
                    className={`p-4 rounded-lg border-l-4 ${
                      result.isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/30'
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">
                        Q{index + 1} &mdash; {result.skill}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          result.isCorrect
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {result.isCorrect ? '\u2713 Correct' : '\u2717 Wrong'}
                      </span>
                    </div>
                    <p className="text-sm mb-1">
                      <strong>Your answer:</strong> {result.selectedAnswer || '(no answer)'}
                    </p>
                    {!result.isCorrect && (
                      <p className="text-sm mb-1">
                        <strong>Correct:</strong> {result.correctAnswer}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Explanation:</strong> {result.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetAssessment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Take Another Assessment
              </button>
              <button
                onClick={() => downloadJSON(
                  buildReport(assessmentData, verificationResult, assessmentData?.candidateName, false, proctoringEnabled, proctoringViolations),
                  assessmentData?.candidateName,
                )}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Download Report
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function scoreLocally(
  data: SkillAssessmentData | null,
  answers: Record<string, string>,
): VerificationResult | null {
  if (!data) return null
  const results = data.answerKey.map((ak) => {
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
  const correctAnswers = results.filter((r) => r.isCorrect).length
  const totalQuestions = results.length
  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers: totalQuestions - correctAnswers,
    score: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    results,
  }
}

function buildReport(
  a: SkillAssessmentData | null,
  v: VerificationResult | null,
  name: string | undefined,
  terminated: boolean,
  proctoringEnabled = false,
  proctoringViolations: ProctoringViolation[] = [],
) {
  if (!a || !v) return {}

  // Build a lookup: questionId → Question (for question text, options, difficulty)
  const questionById: Record<string, Question> = {}
  a.skills.forEach((s) => s.questions.forEach((q) => { questionById[q.id] = q }))

  // Build a lookup: questionId → VerificationResult entry
  const resultById: Record<string, typeof v.results[number]> = {}
  v.results.forEach((r) => { resultById[r.questionId] = r })

  const skillBreakdowns = a.skills.map((s) => {
    const questions = s.questions.map((q) => {
      const r = resultById[q.id]
      return {
        questionId: q.id,
        question: q.question,
        difficulty: q.difficulty,
        options: q.options,
        yourAnswer: r?.selectedAnswer || '(no answer)',
        correctAnswer: r?.correctAnswer ?? '',
        result: r?.isCorrect ? 'CORRECT' : 'INCORRECT',
        explanation: r?.explanation ?? '',
      }
    })
    const correct = questions.filter((q) => q.result === 'CORRECT').length
    const wrong = questions.filter((q) => q.result === 'INCORRECT').length
    return {
      skill: s.skill,
      correct,
      wrong,
      total: s.totalQuestions,
      questions,
    }
  })

  return {
    candidate: name || 'N/A',
    date: a.date,
    status: terminated ? 'TERMINATED' : 'COMPLETED',
    summary: {
      score: `${v.score}%`,
      correct: v.correctAnswers,
      wrong: v.wrongAnswers,
      total: v.totalQuestions,
    },
    proctoring: {
      enabled: proctoringEnabled,
      totalViolations: proctoringViolations.length,
      events: proctoringViolations.map(pv => ({
        type: pv.type,
        message: pv.message,
        time: new Date(pv.timestamp).toISOString(),
        ...(pv.gazeDirection ? { gazeDirection: pv.gazeDirection } : {}),
      })),
    },
    skills: skillBreakdowns,
  }
}

function downloadJSON(data: object, name: string | undefined) {
  const el = document.createElement('a')
  el.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  el.download = `skill-verification-${name || 'report'}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
}
