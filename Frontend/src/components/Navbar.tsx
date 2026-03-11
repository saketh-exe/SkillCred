import React, { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Props = { onUpload: (file: File) => void }

export default function Navbar({ onUpload }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  const triggerUpload = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    onUpload(file)
    navigate('/')
  }

  return (
    <nav className="w-full bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-semibold">SkillCred</Link>
        <Link to="/interview" className="hover:underline">Interview</Link>
        <Link to="/test" className="hover:underline">Test</Link>
        <Link to="/skills" className="hover:underline">Skills</Link>
        <Link to="/github" className="hover:underline">GitHub Analyzer</Link>
      </div>

      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
        >
          Choose Resume
        </button>
        <button
          onClick={triggerUpload}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
        >
          Upload Resume
        </button>
      </div>
    </nav>
  )
}
