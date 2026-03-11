import type { Api } from '../hooks/useApi'

export default function Home({ api }: { api: Api }) {
  const { result, error, loading, post } = api
  return (
    <div className="p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to SkillCred</h1>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => void post('assessments/interview', 'AI Interview')}
          disabled={loading === 'AI Interview'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          {loading === 'AI Interview' ? 'Loading...' : 'AI Interview'}
        </button>

        <button
          onClick={() => void post('assessments/test', 'AI Test')}
          disabled={loading === 'AI Test'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          {loading === 'AI Test' ? 'Loading...' : 'AI Test'}
        </button>

        <button
          onClick={() => void post('integrations/github/analyze', 'Github Analyzer')}
          disabled={loading === 'Github Analyzer'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          {loading === 'Github Analyzer' ? 'Loading...' : 'Github Analyzer'}
        </button>
      </div>

      {result && <p className="mt-4 text-green-600"><strong>Response:</strong> {result.message}</p>}
      {error && <p className="mt-4 text-red-600"><strong>Error:</strong> {error}</p>}
    </div>
  )
}
