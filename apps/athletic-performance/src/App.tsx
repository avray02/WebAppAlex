import { RequireAuth } from '@dailyme/auth'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { AppShell } from './app/AppShell'
import { DashboardPage } from './routes/DashboardPage'
import { PerformanceFormPage } from './routes/PerformanceFormPage'

function App() {
  const loginHref = getLoginHref()
  const portalHref = getPortalHref()

  return (
    <AppProviders>
      <Routes>
        <Route
          element={
            <RequireAuth
              appId="athletic-performance"
              loginHref={loginHref}
              portalHref={portalHref}
            />
          }
        >
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/new" element={<PerformanceFormPage />} />
            <Route
              path="/edit/:performanceId"
              element={<PerformanceFormPage />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  )
}

function getLoginHref() {
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`

  return `${getRootPath()}/apps/portal/login.html?redirect=${encodeURIComponent(redirect)}`
}

function getPortalHref() {
  return `${getRootPath()}/apps/portal/index.html?access=denied&app=athletic-performance`
}

function getRootPath() {
  const appBase = import.meta.env.BASE_URL
  const appsMarker = '/apps/'
  const appsIndex = appBase.indexOf(appsMarker)

  return appsIndex >= 0 ? appBase.slice(0, appsIndex) : ''
}

export default App
