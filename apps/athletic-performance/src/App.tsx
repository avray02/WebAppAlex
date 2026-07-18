import { LoginPage, RequireAuth } from '@webappalex/auth'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { AppShell } from './app/AppShell'
import { DashboardPage } from './routes/DashboardPage'
import { WizardPage } from './routes/WizardPage'

function App() {
  const portalHref = getPortalHref()

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
        <Route
          element={
            <RequireAuth
              appId="athletic-performance"
              portalHref={portalHref}
            />
          }
        >
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

function getPortalHref() {
  const appBase = import.meta.env.BASE_URL
  const appsMarker = '/apps/'
  const appsIndex = appBase.indexOf(appsMarker)
  const rootPath = appsIndex >= 0 ? appBase.slice(0, appsIndex) : ''

  return `${rootPath}/apps/portal/index.html?access=denied&app=athletic-performance`
}

export default App
