import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'

type RequireAuthProps = {
  appId?: string
  portalHref?: string
}

export function RequireAuth({ appId, portalHref = '/' }: RequireAuthProps) {
  const location = useLocation()
  const {
    user,
    isLoading,
    authorizationError,
    hasAppAccess,
  } = useAuth()

  if (isLoading) {
    return <div className="app-loading">Chargement de la session</div>
  }

  if (authorizationError) {
    return (
      <main className="login-page">
        <section className="login-panel access-denied-panel">
          <h1>Acces indisponible</h1>
          <p>{authorizationError}</p>
        </section>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (appId && !hasAppAccess(appId)) {
    return (
      <main className="login-page">
        <section className="login-panel access-denied-panel">
          <h1>Acces refuse</h1>
          <p>Ton compte ne dispose pas de cette application.</p>
          <a className="primary-button" href={portalHref}>
            Retour au portail
          </a>
        </section>
      </main>
    )
  }

  return <Outlet />
}
