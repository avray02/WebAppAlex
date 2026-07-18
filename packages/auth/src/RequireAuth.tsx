import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'

export function RequireAuth() {
  const location = useLocation()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="app-loading">Chargement de la session</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
