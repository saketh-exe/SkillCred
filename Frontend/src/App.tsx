import './App.css'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import useApi from './hooks/useApi'
import Home from './pages/Home'
import InterviewPage from './pages/Interview'
import TestPage from './pages/Test'
import GitHubPage from './pages/GitHub'
import SkillVerificationPage from './pages/SkillVerification'
import { QuizProvider, useQuiz } from './context/QuizContext'

function AppInner() {
  const api = useApi()
  const { quizActive } = useQuiz()

  const handleUpload = (file: File) => {
    const form = new FormData()
    form.append('resume', file)
    void api.post('resumes', 'Upload Resume', form)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {!quizActive && <Navbar onUpload={handleUpload} />}

      <main className={quizActive ? '' : 'py-8'}>
        <Routes>
          <Route path="/" element={<Home api={api} />} />
          <Route path="/interview" element={<InterviewPage api={api} />} />
          <Route path="/test" element={<TestPage api={api} />} />
          <Route path="/github" element={<GitHubPage api={api} />} />
          <Route path="/skills" element={<SkillVerificationPage api={api} />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <QuizProvider>
      <AppInner />
    </QuizProvider>
  )
}

export default App
