import {} from 'react'
import type { Api } from '../hooks/useApi'

export default function InterviewPage({ api }: { api: Api }) {
  const { result, error, loading, post } = api
  return (
    <div className="p-6 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-4">Interview Assessment</h2>
      <button
        onClick={() => void post('assessments/interview', 'AI Interview')}
        disabled={loading === 'AI Interview'}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        {loading === 'AI Interview' ? 'Loading...' : 'Run Interview'}
      </button>
      {result && <p className="mt-4 text-green-600">{result.message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  )
}
