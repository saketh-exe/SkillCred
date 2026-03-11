import './App.css'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import useApi from './hooks/useApi'
import Home from './pages/Home'
import InterviewPage from './pages/Interview'
import TestPage from './pages/Test'
import GitHubPage from './pages/GitHub'
import ResumePage from './pages/Resume'

function App() {
  const api = useApi()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="py-8">
        <Routes>
          <Route path="/" element={<Home api={api} />} />
          <Route path="/interview" element={<InterviewPage api={api} />} />
          <Route path="/test" element={<TestPage api={api} />} />
          <Route path="/github" element={<GitHubPage />} />
          <Route path="/resume" element={<ResumePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
