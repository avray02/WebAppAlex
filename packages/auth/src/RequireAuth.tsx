import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'

type RequireAuthProps = {
  appId?: string
  loginHref?: string
  portalHref?: string
}

export function RequireAuth({
  appId,
  loginHref,
  portalHref = '/',
}: RequireAuthProps) {
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
    if (loginHref) {
      return <ExternalLoginRedirect href={loginHref} />
    }

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

function ExternalLoginRedirect({ href }: { href: string }) {
  useEffect(() => {
    const target = new URL(href, window.location.origin)

    if (target.origin === window.location.origin) {
      window.location.replace(target.toString())
    }
  }, [href])

  return <div className="app-loading">Redirection vers la connexion</div>
}
