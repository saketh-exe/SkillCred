import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-full bg-gray-800 text-white px-4 py-3 flex items-center">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-semibold">SkillCred</Link>
        <Link to="/resume" className="hover:underline">Resume Parser</Link>
        <Link to="/interview" className="hover:underline">Interview</Link>
        <Link to="/test" className="hover:underline">Test</Link>
        <Link to="/github" className="hover:underline">GitHub Analyzer</Link>
      </div>
    </nav>
  )
}
