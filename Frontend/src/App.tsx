import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import StudentSignup from './pages/auth/StudentSignup'
import RecruiterSignup from './pages/auth/RecruiterSignup'

// Student pages
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/Dashboard'
import SkillVerification from './pages/student/SkillVerification'
import SkillGapAnalysis from './pages/student/SkillGapAnalysis'
import JobMatches from './pages/student/JobMatches'
import Applications from './pages/student/Applications'
import StudentFeedback from './pages/student/Feedback'
import Profile from './pages/student/Profile'

// Recruiter pages
import RecruiterLayout from './pages/recruiter/RecruiterLayout'
import RecruiterDashboard from './pages/recruiter/Dashboard'
import JobPostings from './pages/recruiter/JobPostings'
import CandidateDiscovery from './pages/recruiter/CandidateDiscovery'
import CandidateProfile from './pages/recruiter/CandidateProfile'
import Pipeline from './pages/recruiter/Pipeline'
import Compare from './pages/recruiter/Compare'
import RecruiterFeedback from './pages/recruiter/Feedback'
import Organization from './pages/recruiter/Organization'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup/student" element={<StudentSignup />} />
      <Route path="/auth/signup/recruiter" element={<RecruiterSignup />} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="skills" element={<SkillVerification />} />
        <Route path="gap-analysis" element={<SkillGapAnalysis />} />
        <Route path="jobs" element={<JobMatches />} />
        <Route path="applications" element={<Applications />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Recruiter routes */}
      <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><RecruiterLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="jobs" element={<JobPostings />} />
        <Route path="candidates" element={<CandidateDiscovery />} />
        <Route path="candidates/:id" element={<CandidateProfile />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="compare" element={<Compare />} />
        <Route path="feedback" element={<RecruiterFeedback />} />
        <Route path="organization" element={<Organization />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
