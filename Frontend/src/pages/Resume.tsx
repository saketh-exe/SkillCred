import { useState, useRef } from 'react'
import axios, { AxiosError } from 'axios'

type GitHubInfo = { username: string | null; url: string | null } | null

type Project = {
  name: string
  description: string | null
  github: string | null
  technologies: string[]
}

type Internship = {
  company: string
  role: string
  duration: string | null
  description: string | null
}

type ParsedResume = {
  github: GitHubInfo
  skills: string[]
  projects: Project[]
  internships: Internship[]
}

type SkillAnalysis = {
  skill: string
  verificationStatus: 'verified' | 'partially_verified' | 'unverified'
  evidence: string | null
}

type ProjectAnalysis = {
  name: string
  source: 'resume_only' | 'github_only' | 'both'
  githubRepo: string | null
  notes: string | null
}

type CredibilityReport = {
  overallScore: number
  summary: string
  skillsAnalysis: SkillAnalysis[]
  projectsAnalysis: ProjectAnalysis[]
  strengths: string[]
  redFlags: string[]
  recommendations: string[]
}

const statusColor = {
  verified: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  partially_verified: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  unverified: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
}

const sourceLabel = {
  both: { label: 'On Resume + GitHub', color: 'text-green-600 dark:text-green-400' },
  resume_only: { label: 'Resume only (no matching repo)', color: 'text-yellow-600 dark:text-yellow-400' },
  github_only: { label: 'GitHub only (not in resume)', color: 'text-indigo-600 dark:text-indigo-400' },
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500'
  return (
    <div className={`text-5xl font-bold ${color}`}>
      {score}<span className="text-lg font-normal text-gray-400">/100</span>
    </div>
  )
}

export default function ResumePage() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const [report, setReport] = useState<CredibilityReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportError, setReportError] = useState('')
  const [fileName, setFileName] = useState('')
  const [githubUsername, setGithubUsername] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please select a PDF file first.'); return }
    setFileName(file.name)
    setLoading(true)
    setError('')
    setParsed(null)
    setReport(null)
    setReportError('')

    const form = new FormData()
    form.append('resume', file)

    try {
      const res = await axios.post<ParsedResume>('/api/resumes', form)
      setParsed(res.data)
      const extractedUsername = res.data.github?.username ?? ''
      setGithubUsername(extractedUsername)
      setUsernameInput(extractedUsername)
    } catch (err) {
      const msg = err instanceof AxiosError
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCredibility = async () => {
    if (!parsed) return
    setReportLoading(true)
    setReportError('')
    setReport(null)

    // Build a resume copy with the (possibly edited) username
    const resumePayload = {
      ...parsed,
      github: { username: githubUsername.trim() || null, url: parsed.github?.url ?? null },
    }

    try {
      const res = await axios.post<{ github: unknown; credibilityReport: CredibilityReport }>(
        '/api/resumes/credibility',
        { resume: resumePayload }
      )
      setReport(res.data.credibilityReport)
    } catch (err) {
      const msg = err instanceof AxiosError
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : String(err)
      setReportError(msg)
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Resume Parser</h1>

      {/* Upload section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Upload a PDF resume to extract skills, projects, internships and GitHub information.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={() => setFileName(fileRef.current?.files?.[0]?.name ?? '')} />
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-sm"
          >
            Choose PDF
          </button>
          {fileName && <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">{fileName}</span>}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded text-sm font-medium"
          >
            {loading ? 'Parsing...' : 'Parse Resume'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Resume results */}
      {parsed && (
        <div className="space-y-6">

          {/* GitHub */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>🐙</span> GitHub
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500">Username:</span>
                {editingUsername ? (
                  <>
                    <input
                      autoFocus
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { setGithubUsername(usernameInput.trim()); setEditingUsername(false) }
                        if (e.key === 'Escape') { setUsernameInput(githubUsername); setEditingUsername(false) }
                      }}
                      placeholder="GitHub username"
                      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => { setGithubUsername(usernameInput.trim()); setEditingUsername(false) }} className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded">Save</button>
                    <button onClick={() => { setUsernameInput(githubUsername); setEditingUsername(false) }} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{githubUsername || <span className="italic text-gray-400">not found</span>}</span>
                    <button
                      onClick={() => { setUsernameInput(githubUsername); setEditingUsername(true); setReport(null); setReportError('') }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 underline"
                    >
                      {githubUsername ? 'Edit' : 'Set username'}
                    </button>
                  </>
                )}
              </div>
              {parsed.github?.url && (
                <p>
                  <span className="text-gray-500">URL:</span>{' '}
                  <a href={parsed.github.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{parsed.github.url}</a>
                </p>
              )}
            </div>
          </section>

          {/* Skills */}
          {parsed.skills.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-semibold mb-3">🛠 Skills</h2>
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((skill) => (
                  <span key={skill} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-700">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {parsed.projects.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-semibold mb-4">🚀 Projects</h2>
              <div className="space-y-4">
                {parsed.projects.map((project, i) => (
                  <div key={i} className="border-l-2 border-indigo-400 pl-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{project.name}</h3>
                      {project.github && (
                        <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                          GitHub ↗
                        </a>
                      )}
                    </div>
                    {project.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>}
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((tech) => (
                          <span key={tech} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Internships */}
          {parsed.internships.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-semibold mb-4">💼 Experience</h2>
              <div className="space-y-4">
                {parsed.internships.map((intern, i) => (
                  <div key={i} className="border-l-2 border-green-400 pl-4">
                    <h3 className="font-medium">{intern.role}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{intern.company}{intern.duration ? ` · ${intern.duration}` : ''}</p>
                    {intern.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{intern.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* GitHub Credibility CTA */}
          {!report && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-indigo-800 dark:text-indigo-200">GitHub Credibility Check</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {githubUsername
                    ? <>Cross-reference resume claims against <strong>@{githubUsername}</strong>'s GitHub activity using AI.</>
                    : 'Set a GitHub username above to run the credibility check.'}
                </p>
              </div>
              <button
                onClick={handleCredibility}
                disabled={reportLoading || !githubUsername.trim() || editingUsername}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded text-sm font-medium"
              >
                {reportLoading ? 'Analyzing…' : 'Run Credibility Check'}
              </button>
            </div>
          )}
          {reportError && (
            <p className="text-sm text-red-600 px-1">{reportError}</p>
          )}

          {/* Credibility Report */}
          {report && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">📊 Credibility Report</h2>

              {/* Score + summary */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row gap-6 items-start">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Overall Score</p>
                  <ScoreRing score={report.overallScore} />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{report.summary}</p>
              </section>

              {/* Strengths & Red Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <section className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 p-5">
                  <h3 className="font-semibold text-green-700 dark:text-green-300 mb-3">✅ Strengths</h3>
                  {report.strengths.length === 0
                    ? <p className="text-sm text-gray-400">None noted.</p>
                    : <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                        {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                  }
                </section>
                <section className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-5">
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-3">🚩 Red Flags</h3>
                  {report.redFlags.length === 0
                    ? <p className="text-sm text-gray-400">None found.</p>
                    : <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                        {report.redFlags.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                  }
                </section>
              </div>

              {/* Skills analysis */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold mb-4">🛠 Skills Verification</h3>
                <div className="flex flex-wrap gap-2">
                  {report.skillsAnalysis.map((s) => (
                    <div key={s.skill} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColor[s.verificationStatus]}`} title={s.evidence ?? undefined}>
                      {s.verificationStatus === 'verified' ? '✓' : s.verificationStatus === 'partially_verified' ? '~' : '✗'} {s.skill}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {report.skillsAnalysis.filter(s => s.evidence).map((s) => (
                    <p key={s.skill} className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{s.skill}:</span> {s.evidence}
                    </p>
                  ))}
                </div>
              </section>

              {/* Projects analysis */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold mb-4">🚀 Projects Cross-Reference</h3>
                <div className="space-y-3">
                  {report.projectsAnalysis.map((p, i) => (
                    <div key={i} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.githubRepo && <span className="text-xs text-gray-400">→ {p.githubRepo}</span>}
                        <span className={`text-xs ${sourceLabel[p.source].color}`}>{sourceLabel[p.source].label}</span>
                      </div>
                      {p.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold mb-3">💡 Recommendations</h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                    {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Raw JSON */}
          <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400">View raw JSON output</summary>
            <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-auto max-h-96">
              {JSON.stringify({ resume: parsed, credibilityReport: report }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
