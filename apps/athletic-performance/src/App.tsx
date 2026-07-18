import { LoginPage, RequireAuth } from '@webappalex/auth'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { AppShell } from './app/AppShell'
import { DashboardPage } from './routes/DashboardPage'
import { WizardPage } from './routes/WizardPage'

function App() {
  return (
    <AppProviders>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              appName="Athletic Performance"
              subtitle="Compte WebAppAlex"
            />
          }
        />
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

export default App
