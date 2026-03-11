import { useEffect, useState } from 'react';
import { Card, Badge, Button, Tabs, Modal } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import { assessmentService } from '../../services/assessmentService';
import { useToast } from '../../components/ui/Toast';
import type { Skill, QuizQuestion, AssessmentResult, SkillCategory } from '../../types';

const CATEGORIES: { label: string; value: SkillCategory }[] = [
  { label: 'All', value: 'All' }, { label: 'Web', value: 'Web' }, { label: 'Backend', value: 'Backend' },
  { label: 'Data', value: 'Data' }, { label: 'DevOps', value: 'DevOps' }, { label: 'Mobile', value: 'Mobile' },
];

export default function SkillVerification() {
  const { addToast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [category, setCategory] = useState<SkillCategory>('All');
  const [quizSkill, setQuizSkill] = useState<Skill | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => { studentService.getSkills().then(setSkills); }, []);

  const filtered = category === 'All' ? skills : skills.filter(s => s.category === category);

  const startQuiz = async (skill: Skill) => {
    const qs = await assessmentService.getQuestions(skill.name);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(-1));
    setCurrentQ(0);
    setTimeLeft(600);
    setResult(null);
    setQuizSkill(skill);
  };

  const selectAnswer = (idx: number) => {
    setAnswers(prev => { const n = [...prev]; n[currentQ] = idx; return n; });
  };

  const submitQuiz = async () => {
    if (!quizSkill) return;
    const res = await assessmentService.submitAssessment(quizSkill.id, quizSkill.name, answers);
    setResult(res);
    if (res.passed) {
      addToast(`${quizSkill.name} skill verified!`, 'success');
      setSkills(prev => prev.map(s => s.id === quizSkill.id ? { ...s, status: 'Verified', score: (res.score / res.total) * 100 } : s));
    }
  };

  // Timer
  useEffect(() => {
    if (!quizSkill || result) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [quizSkill, result]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold">Skill Verification</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Verify your knowledge to earn badges and improve your profile visibility.</p>
      </div>

      <Tabs
        tabs={CATEGORIES.map(c => ({ label: c.label, value: c.value }))}
        defaultValue="All"
        onChange={v => setCategory(v as SkillCategory)}
      >
        {() => (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filtered.map(skill => (
              <Card key={skill.id} className="p-4" hover>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{skill.icon}</span>
                    <div>
                      <p className="text-[15px] font-semibold">{skill.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{skill.difficulty}</p>
                    </div>
                  </div>
                  <Badge variant={skill.status === 'Verified' ? 'success' : skill.status === 'In Progress' ? 'warning' : 'neutral'}>
                    {skill.status}
                  </Badge>
                </div>
                {skill.status === 'Verified' && skill.score != null && (
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Score: <span className="font-[var(--font-mono)] text-[var(--success)]">{skill.score}%</span></p>
                )}
                {skill.status !== 'Verified' && (
                  <Button variant="secondary" className="w-full text-xs h-8 mt-1" onClick={() => startQuiz(skill)}>
                    Start Verification
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </Tabs>

      {/* Quiz Modal */}
      <Modal open={!!quizSkill} onClose={() => { setQuizSkill(null); setResult(null); }} title={result ? 'Results' : `${quizSkill?.name} Skill Verification`} size="lg">
        {!result ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-[var(--text-secondary)]">Question {currentQ + 1} of {questions.length}</span>
              <span className="font-[var(--font-mono)] text-sm text-[var(--text-primary)]">{formatTime(timeLeft)}</span>
            </div>
            {/* Progress */}
            <div className="h-1 bg-[var(--bg-elevated)] rounded-full mb-6">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>
            {questions[currentQ] && (
              <div>
                <p className="text-[15px] font-medium mb-4">{questions[currentQ].question}</p>
                <div className="space-y-2">
                  {questions[currentQ].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={`w-full text-left p-3 rounded-[var(--radius-sm)] border text-sm transition-all ${
                        answers[currentQ] === i
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="secondary" disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)}>Previous</Button>
                  {currentQ < questions.length - 1 ? (
                    <Button onClick={() => setCurrentQ(p => p + 1)}>Next</Button>
                  ) : (
                    <Button onClick={submitQuiz}>Submit Assessment</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${result.passed ? 'bg-[var(--success-subtle)]' : 'bg-[var(--danger-subtle)]'}`}>
              <span className="text-3xl">{result.passed ? '🎉' : '😞'}</span>
            </div>
            <p className="font-[var(--font-mono)] text-2xl font-medium mb-2">
              {result.score}/{result.total} Correct — {Math.round((result.score / result.total) * 100)}%
            </p>
            <p className={`text-sm font-medium mb-6 ${result.passed ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {result.passed ? 'Skill Verified!' : 'Not Verified — Try again in 24 hours'}
            </p>
            <div className="text-left space-y-2">
              {questions.map((q, i) => (
                <div key={q.id} className={`p-3 rounded-[var(--radius-sm)] border text-sm ${
                  result.answers[i].selected === result.answers[i].correct
                    ? 'bg-[var(--success-subtle)] border-[#BBF7D0]'
                    : 'bg-[var(--danger-subtle)] border-[#FECACA]'
                }`}>
                  <p className="font-medium mb-1">{q.question}</p>
                  <p className="text-xs">
                    Your answer: {q.options[result.answers[i].selected] ?? 'No answer'}
                    {result.answers[i].selected !== result.answers[i].correct && (
                      <span className="ml-2 text-[var(--success)]">Correct: {q.options[result.answers[i].correct]}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
            <Button className="mt-6" onClick={() => { setQuizSkill(null); setResult(null); }}>Done</Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
