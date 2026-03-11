import { useState } from 'react'
import axios, { AxiosError } from 'axios'

interface LanguageProfile {
  name: string
  bytes: number
  percentage: number
  repoCount: number
  significanceScore: number
}

interface CommitSummary {
  sha: string
  message: string
  date: string
  url: string
  files: {
    filename: string
    status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed' | 'unchanged'
    additions: number
    deletions: number
  }[]
}

interface RepoProfile {
  name: string
  description: string | null
  url: string
  stars: number
  forks: number
  primaryLanguage: string | null
  significanceScore: number
  isFork: boolean
  lastPushed: string
  recentCommits: CommitSummary[]
}

interface GithubAnalysis {
  profile: {
    username: string
    name: string | null
    bio: string | null
    publicRepos: number
    followers: number
    following: number
    avatarUrl: string
    profileUrl: string
    memberSince: string
  }
  languages: LanguageProfile[]
  repositories: RepoProfile[]
  summary: {
    totalReposAnalyzed: number
    ownRepos: number
    forkedRepos: number
    totalCodeBytes: number
    topLanguage: string | null
    mostSignificantRepo: string | null
    totalStars: number
    totalForks: number
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function GitHubPage() {
  const [username, setUsername] = useState('')
  const [analysis, setAnalysis] = useState<GithubAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null)
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null)

  const analyze = async () => {
    if (!username.trim()) { setError('Enter a GitHub username'); return }
    setLoading(true)
    setAnalysis(null)
    setError('')
    try {
      const res = await axios.get<GithubAnalysis>(`/api/integrations/github/analyze?username=${encodeURIComponent(username.trim())}`)
      setAnalysis(res.data)
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.error ?? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">GitHub Analyzer</h2>

      {/* Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void analyze()}
          placeholder="GitHub username"
          className="flex-1 border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
        />
        <button
          onClick={() => void analyze()}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {analysis && (
        <div className="space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4 p-4 border rounded-lg dark:border-gray-700">
            <img src={analysis.profile.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full" />
            <div>
              <a href={analysis.profile.profileUrl} target="_blank" rel="noreferrer" className="text-lg font-semibold hover:underline">
                {analysis.profile.name ?? analysis.profile.username}
              </a>
              {analysis.profile.bio && <p className="text-sm text-gray-500 mt-0.5">{analysis.profile.bio}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {analysis.profile.followers} followers · {analysis.profile.publicRepos} public repos · member since {new Date(analysis.profile.memberSince).getFullYear()}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Stars', value: analysis.summary.totalStars },
              { label: 'Forks', value: analysis.summary.totalForks },
              { label: 'Own repos', value: analysis.summary.ownRepos },
              { label: 'Total code', value: formatBytes(analysis.summary.totalCodeBytes) },
            ].map(({ label, value }) => (
              <div key={label} className="border rounded-lg p-3 text-center dark:border-gray-700">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Languages */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Language Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border dark:border-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-800 text-left">
                  <tr>
                    <th className="px-3 py-2">Language</th>
                    <th className="px-3 py-2">% of code</th>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Repos</th>
                    <th className="px-3 py-2 text-right" title="Weighted by stars & forks of repos using this language">Significance ↑</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.languages.map((lang, i) => (
                    <tr key={lang.name} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
                      <td className="px-3 py-2 font-medium">{lang.name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${lang.percentage}%` }} />
                          </div>
                          <span>{lang.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{formatBytes(lang.bytes)}</td>
                      <td className="px-3 py-2">{lang.repoCount}</td>
                      <td className="px-3 py-2 text-right font-mono">{lang.significanceScore.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Repos */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Top Repositories</h3>
            <div className="space-y-2">
              {analysis.repositories.slice(0, 10).map(repo => (
                <div key={repo.name} className="border rounded-lg dark:border-gray-700 overflow-hidden">
                  {/* Repo header */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <a href={repo.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                          {repo.name}
                        </a>
                        {repo.isFork && <span className="ml-2 text-xs text-gray-400 border rounded px-1">fork</span>}
                        {repo.description && <p className="text-xs text-gray-500 mt-0.5">{repo.description}</p>}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 shrink-0">
                        <span>⭐ {repo.stars}</span>
                        <span>🍴 {repo.forks}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {repo.primaryLanguage && (
                        <p className="text-xs text-gray-400">{repo.primaryLanguage}</p>
                      )}
                      {repo.recentCommits.length > 0 && (
                        <button
                          onClick={() => setExpandedRepo(expandedRepo === repo.name ? null : repo.name)}
                          className="text-xs text-indigo-500 hover:underline ml-auto"
                        >
                          {expandedRepo === repo.name ? 'Hide commits' : `Show ${repo.recentCommits.length} commits`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Commit list */}
                  {expandedRepo === repo.name && (
                    <ul className="border-t dark:border-gray-700 divide-y dark:divide-gray-700">
                      {repo.recentCommits.map(c => {
                        const commitKey = `${repo.name}/${c.sha}`
                        const isExpanded = expandedCommit === commitKey
                        const statusColor = (s: string) =>
                          s === 'added' ? 'text-green-500' : s === 'removed' ? 'text-red-500' : 'text-yellow-500'
                        return (
                          <li key={c.sha} className="bg-gray-50 dark:bg-gray-800/50">
                            {/* Commit row */}
                            <div
                              className="px-3 py-2 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              onClick={() => setExpandedCommit(isExpanded ? null : commitKey)}
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="font-mono text-xs text-indigo-400 hover:underline shrink-0"
                                >
                                  {c.sha}
                                </a>
                                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{c.message}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()}</span>
                                {c.files.length > 0 && <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>}
                              </div>
                            </div>

                            {/* File list */}
                            {isExpanded && c.files.length > 0 && (
                              <ul className="border-t dark:border-gray-700 divide-y dark:divide-gray-600 pl-6">
                                {c.files.map(f => (
                                  <li key={f.filename} className="px-3 py-1.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`text-xs font-mono uppercase w-8 shrink-0 ${statusColor(f.status)}`}>
                                        {f.status.slice(0, 3)}
                                      </span>
                                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{f.filename}</span>
                                    </div>
                                    <span className="text-xs shrink-0">
                                      <span className="text-green-500">+{f.additions}</span>
                                      {' '}
                                      <span className="text-red-500">-{f.deletions}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
