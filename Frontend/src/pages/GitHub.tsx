import type { Api } from '../hooks/useApi'

export default function GitHubPage({ api }: { api: Api }) {
  const { result, error, loading, post } = api
  return (
    <div className="p-6 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-4">GitHub Analyzer</h2>
      <p className="mb-4 text-sm text-gray-600">Analyze a GitHub repository (endpoint currently placeholder).</p>
      <button
        onClick={() => void post('integrations/github/analyze', 'Github Analyzer')}
        disabled={loading === 'Github Analyzer'}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        {loading === 'Github Analyzer' ? 'Loading...' : 'Run GitHub Analyzer'}
      </button>
      {result && <p className="mt-4 text-green-600">{result.message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  )
}
