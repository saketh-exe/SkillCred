import { useRef, useState } from 'react'
import axios, { AxiosError } from 'axios'
import './App.css'

type Result = { message: string } | null

function App() {
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const post = async (route: string, label: string, body?: FormData) => {
    setLoading(label)
    setResult(null)
    setError('')
    try {
      const res = await axios.post<{ message: string }>(`/api/${route}`, body ?? {})
      setResult(res.data)
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.message ?? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(null)
    }
  }

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please select a PDF file first'); return }
    const form = new FormData()
    form.append('resume', file)
    void post('resumes/', 'Upload Resume', form)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem' }}>
      <h1>SkillCred</h1>

      {/* Upload Resume */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input ref={fileRef} type="file" accept="application/pdf" />
        <button onClick={handleUpload} disabled={loading === 'Upload Resume'}>
          {loading === 'Upload Resume' ? 'Uploading...' : 'Upload Resume (PDF)'}
        </button>
      </div>

      {/* Dummy routes */}
      <button onClick={() => void post('assessments/interview', 'AI Interview')} disabled={loading === 'AI Interview'}>
        {loading === 'AI Interview' ? 'Loading...' : 'AI Interview'}
      </button>

      <button onClick={() => void post('assessments/test', 'AI Test')} disabled={loading === 'AI Test'}>
        {loading === 'AI Test' ? 'Loading...' : 'AI Test'}
      </button>

      <button onClick={() => void post('integrations/github/analyze', 'Github Analyzer')} disabled={loading === 'Github Analyzer'}>
        {loading === 'Github Analyzer' ? 'Loading...' : 'Github Analyzer'}
      </button>

      {result && <p style={{ color: 'green' }}><strong>Response:</strong> {result.message}</p>}
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
    </div>
  )
}

export default App
