import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, X } from 'lucide-react';
import { studentService } from '../../services/studentService';
import type { InterviewConfig, InterviewMessage, InterviewEvaluation } from '../../types';
import type { StudentLayoutContext } from './StudentLayout';

/* ------------------------------------------------------------------ */
/*  Speech helpers (browser Web Speech API)                           */
/* ------------------------------------------------------------------ */

const SpeechRecognition =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

function speakText(text: string, onEnd?: () => void) {
  // Cancel any queued/stuck speech first (Chrome TTS can get stuck)
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    onEnd?.();
  };

  u.onend = finish;
  u.onerror = finish;

  // Safety timeout — Chrome TTS can silently hang. Estimate ~80ms per char.
  const estimatedMs = Math.max(4000, text.length * 80);
  const safetyTimer = setTimeout(finish, estimatedMs);

  speechSynthesis.speak(u);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Phase = 'loading' | 'ready' | 'active' | 'ending' | 'results';

export default function AIInterview() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { setHideChrome } = useOutletContext<StudentLayoutContext>();

  // ── Config & session state ──────────────────────────────────
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  // Refs to break stale closures in speech recognition callbacks
  const interviewIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const micEnabledRef = useRef(true);

  // ── Conversation ────────────────────────────────────────────
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimText, setInterimText] = useState('');

  // ── Controls ────────────────────────────────────────────────
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  // ── Timer ───────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(0);

  // ── Media ───────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // ── Evaluation ──────────────────────────────────────────────
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  /* ── Hide sidebar/nav during interview ── */
  useEffect(() => {
    if (phase === 'active' || phase === 'ending') setHideChrome(true);
    return () => setHideChrome(false);
  }, [phase, setHideChrome]);

  /* ── Auto-scroll transcript ── */
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Keep refs in sync with state ── */
  useEffect(() => { interviewIdRef.current = interviewId; }, [interviewId]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { micEnabledRef.current = micEnabled; }, [micEnabled]);

  /* ── Timer tick ── */
  useEffect(() => {
    if (phase === 'active') {
      startTimeRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Load config ── */
  useEffect(() => {
    if (!appId) return;
    studentService.getInterviewConfig(appId)
      .then(c => { setConfig(c); setPhase('ready'); })
      .catch(e => setError(e.message));
  }, [appId]);

  /* ── Camera stream ── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Camera not available — that's ok, continue without
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (phase === 'active' && cameraEnabled) startCamera();
    else stopCamera();
    return stopCamera;
  }, [phase, cameraEnabled, startCamera, stopCamera]);

  /* ── Toggle camera track ── */
  useEffect(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = cameraEnabled;
  }, [cameraEnabled]);

  /* ── Send candidate message → get AI reply (uses refs to avoid stale closures) ── */
  const handleCandidateMessage = useCallback(async (text: string) => {
    const curId = interviewIdRef.current;
    if (!appId || !curId || isProcessingRef.current) return;
    setIsProcessing(true);
    isProcessingRef.current = true;

    const candidateMsg: InterviewMessage = { role: 'candidate', text };
    setMessages(prev => [...prev, candidateMsg]);

    try {
      const { reply } = await studentService.sendInterviewMessage(appId, curId, text);
      const aiMsg: InterviewMessage = { role: 'interviewer', text: reply };
      setMessages(prev => [...prev, aiMsg]);

      setIsSpeaking(true);
      speakText(reply, () => {
        setIsSpeaking(false);
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (micEnabledRef.current) startListeningRef.current();
      });
    } catch (err: any) {
      if (err.message?.includes('Rate limited')) {
        setTimeout(() => {
          setIsProcessing(false);
          isProcessingRef.current = false;
          startListeningRef.current();
        }, 3000);
        return;
      }
      setMessages(prev => [...prev, { role: 'interviewer', text: '(Sorry, I had a technical issue. Could you repeat that?)' }]);
      setIsProcessing(false);
      isProcessingRef.current = false;
      if (micEnabledRef.current) setTimeout(() => startListeningRef.current(), 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const handleCandidateMessageRef = useRef(handleCandidateMessage);
  useEffect(() => { handleCandidateMessageRef.current = handleCandidateMessage; }, [handleCandidateMessage]);

  /* ── Speech recognition ── */
  const lastInterimRef = useRef('');

  const startListening = useCallback(() => {
    if (!SpeechRecognition || !micEnabledRef.current) return;

    // Stop any existing recognition first
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;   // one utterance at a time — most reliable
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let gotFinalResult = false;

    recognition.onstart = () => {
      setIsListening(true);
      lastInterimRef.current = '';
    };

    recognition.onend = () => {
      setIsListening(false);

      // If we never got a final result but had interim text, submit that instead
      // (handles the case where the browser cuts off without finalizing)
      if (!gotFinalResult && lastInterimRef.current.trim() && !isProcessingRef.current) {
        const text = lastInterimRef.current.trim();
        lastInterimRef.current = '';
        setInterimText('');
        handleCandidateMessageRef.current(text);
        return;
      }

      lastInterimRef.current = '';
      setInterimText('');

      // Auto-restart if we didn't capture anything and aren't processing
      if (!gotFinalResult && !isProcessingRef.current && micEnabledRef.current) {
        setTimeout(() => startListeningRef.current(), 400);
      }
    };

    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) lastInterimRef.current = interim;
      setInterimText(interim);

      if (final) {
        gotFinalResult = true;
        lastInterimRef.current = '';
        setInterimText('');
        handleCandidateMessageRef.current(final.trim());
      }
    };

    recognition.onerror = (e: any) => {
      // 'no-speech' and 'aborted' are benign — auto-restart
      if (e.error === 'no-speech' || e.error === 'aborted') {
        setIsListening(false);
        setInterimText('');
        lastInterimRef.current = '';
        if (!isProcessingRef.current && micEnabledRef.current) {
          setTimeout(() => startListeningRef.current(), 500);
        }
        return;
      }
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const startListeningRef = useRef(startListening);
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
    setInterimText('');
  }, []);

  /* ── Start interview ── */
  const beginInterview = async () => {
    if (!appId) return;
    setPhase('active');
    try {
      const { interviewId: id, greeting } = await studentService.startInterview(appId);
      setInterviewId(id);
      interviewIdRef.current = id;
      const aiMsg: InterviewMessage = { role: 'interviewer', text: greeting };
      setMessages([aiMsg]);

      setIsSpeaking(true);
      speakText(greeting, () => {
        setIsSpeaking(false);
        if (micEnabledRef.current) startListeningRef.current();
      });
    } catch (e: any) {
      setError(e.message);
      setPhase('ready');
    }
  };

  /* ── End interview ── */
  const endInterview = async () => {
    stopListening();
    speechSynthesis.cancel();
    clearInterval(timerRef.current);
    setPhase('ending');

    if (!appId || !interviewId) { navigate(-1); return; }

    try {
      const { evaluation: ev } = await studentService.endInterview(appId, interviewId, elapsed);
      setEvaluation(ev);
      setPhase('results');
    } catch {
      setPhase('results');
    }
  };

  /* ── Format timer ── */
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  /* ────────────────────────────────────────────────────────────── */
  /*  RENDER                                                        */
  /* ────────────────────────────────────────────────────────────── */

  // Fatal error state (loading failed entirely)
  if (error && phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-[var(--danger)] text-lg font-semibold">⚠ {error}</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-surface)] transition">
          Go Back
        </button>
      </div>
    );
  }

  // Loading
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Ready screen
  if (phase === 'ready' && config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
          <MessageSquare size={36} className="text-[var(--accent)]" />
        </div>
        <h1 className="font-display text-[28px] tracking-tight">AI Interview</h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          You're about to start a live AI-powered interview for <strong>{config.jobTitle}</strong>. 
          The AI interviewer will ask you questions based on the job description and required skills. 
          Speak naturally — your microphone will capture your responses.
        </p>
        <div className="w-full bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4 text-left">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-2">Skills being evaluated</p>
          <div className="flex flex-wrap gap-1.5">
            {config.requiredSkills.map(s => (
              <span key={s} className="px-2 py-0.5 text-[12px] bg-[var(--accent-subtle)] text-[var(--accent)] rounded-full font-medium">{s}</span>
            ))}
          </div>
        </div>
        <div className="text-[12px] text-[var(--text-tertiary)] space-y-1">
          <p>🎤 Make sure your microphone is working</p>
          <p>📷 Camera is optional but recommended</p>
          <p>🔇 Find a quiet environment</p>
        </div>
        {error && (
          <div className="w-full px-4 py-3 bg-[var(--danger-subtle,#fef2f2)] border border-[var(--danger,#ef4444)]/30 rounded-[var(--radius-md)] text-[13px] text-[var(--danger,#ef4444)]">
            ⚠ {error}
          </div>
        )}
        <button onClick={() => { setError(''); beginInterview(); }}
          className="px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold rounded-[var(--radius-md)] transition shadow-lg">
          {error ? 'Retry Interview' : 'Start Interview'}
        </button>
        <button onClick={() => navigate(-1)} className="text-[13px] text-[var(--text-secondary)] hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  // Ending (loading screen)
  if (phase === 'ending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#1a1a2e]">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-white/80 text-sm">Evaluating your interview…</p>
      </div>
    );
  }

  // Results
  if (phase === 'results') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 max-w-2xl mx-auto">
        <h1 className="font-display text-[28px] tracking-tight">Interview Complete</h1>
        {evaluation && (
          <>
            <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center"
              style={{ borderColor: evaluation.overallScore >= 70 ? 'var(--success)' : evaluation.overallScore >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
              <span className="text-[32px] font-bold">{evaluation.overallScore}%</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm text-center max-w-md">{evaluation.summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--success)] mb-2">Strengths</p>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                      <span className="text-[var(--success)]">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--warning)] mb-2">Areas to Improve</p>
                <ul className="space-y-1">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                      <span className="text-[var(--warning)]">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-[12px] text-[var(--text-tertiary)]">
              Duration: {fmt(elapsed)} · {messages.length} messages exchanged
            </p>
          </>
        )}
        {!evaluation && <p className="text-[var(--text-secondary)]">Your interview has been submitted for review.</p>}
        <button onClick={() => navigate('/student/applications')}
          className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-[var(--radius-md)] transition">
          Back to Applications
        </button>
      </div>
    );
  }

  /* ── Active interview (Teams-like UI) ── */
  return (
    <div className="fixed inset-0 bg-[#1a1a2e] flex flex-col text-white z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium">AI Interview — {config?.jobTitle}</span>
        </div>
        <div className="font-mono text-sm text-white/70">{fmt(elapsed)}</div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex items-center justify-center gap-8 p-8 relative">
        {/* AI Interviewer avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center text-5xl transition-all duration-300 ${
            isSpeaking ? 'bg-[#2563eb] ring-4 ring-[#3b82f6]/40 scale-105' : 'bg-[#1e293b]'
          }`}>
            🤖
          </div>
          <span className="text-sm text-white/60">AI Interviewer</span>
          {isSpeaking && (
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse"
                  style={{ height: `${12 + Math.random() * 16}px`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Candidate video / avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-[#1e293b] flex items-center justify-center relative">
            {cameraEnabled ? (
              <video ref={videoRef} autoPlay muted playsInline
                className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <span className="text-5xl">👤</span>
            )}
            {isListening && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-green-400 rounded-full animate-pulse"
                      style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-sm text-white/60">{config?.candidateName ?? 'You'}</span>
        </div>

        {/* Live status */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          {isSpeaking && <p className="text-sm text-blue-300 animate-pulse mb-1">Interviewer is speaking…</p>}
          {isListening && <p className="text-sm text-green-300 animate-pulse mb-1">Listening to you…</p>}
          {isProcessing && !isSpeaking && <p className="text-sm text-yellow-300 animate-pulse mb-1">Processing…</p>}
          {interimText && <p className="text-sm text-white/50 italic max-w-md">"{interimText}"</p>}
        </div>
      </div>

      {/* Transcript sidebar (togglable) */}
      {showTranscript && (
        <div className="absolute right-0 top-12 bottom-20 w-[360px] bg-[#0f172a] border-l border-white/10 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold">Transcript</span>
            <button onClick={() => setShowTranscript(false)} className="p-1 hover:bg-white/10 rounded">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-[#1e293b]">
                  {m.role === 'interviewer' ? '🤖' : '👤'}
                </div>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                  m.role === 'candidate'
                    ? 'bg-[#2563eb] text-white rounded-br-sm'
                    : 'bg-[#1e293b] text-white/90 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Bottom control bar */}
      <div className="flex items-center justify-center gap-4 py-5 bg-black/40">
        {/* Mic toggle */}
        <button onClick={() => {
          const next = !micEnabled;
          setMicEnabled(next);
          micEnabledRef.current = next;
          if (!next) stopListening();
          else if (!isSpeaking && !isProcessing) startListening();
        }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            micEnabled ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-red-600 hover:bg-red-700'
          }`}>
          {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera toggle */}
        <button onClick={() => setCameraEnabled(v => !v)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            cameraEnabled ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-red-600 hover:bg-red-700'
          }`}>
          {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Transcript toggle */}
        <button onClick={() => setShowTranscript(v => !v)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            showTranscript ? 'bg-[#2563eb]' : 'bg-[#334155] hover:bg-[#475569]'
          }`}>
          <MessageSquare size={20} />
        </button>

        {/* End call */}
        <button onClick={endInterview}
          className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
