import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { AppShell } from './app/AppShell'
import { useAuth } from './features/auth/authContext'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './routes/DashboardPage'
import { WizardPage } from './routes/WizardPage'

function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/new" element={<WizardPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  )
}

function RequireAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="app-loading">Chargement de la session</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default App
