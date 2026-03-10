import { useState } from 'react'
import axios, { AxiosError } from 'axios'

export type Api = {
  result: { message: string } | null
  error: string
  loading: string | null
  post: (route: string, label: string, body?: FormData) => Promise<void>
  setError: (s: string) => void
}

export default function useApi(): Api {
  const [result, setResult] = useState<{ message: string } | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)

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

  return { result, error, loading, post, setError }
}
