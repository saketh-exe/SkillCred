import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ProfileDataProvider } from './context/ProfileDataContext'
import { ToastProvider } from './components/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileDataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ProfileDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
