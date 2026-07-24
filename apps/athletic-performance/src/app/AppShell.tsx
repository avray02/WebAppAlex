import { useAuth } from '@dailyme/auth'
import { Activity, Grid2X2, LogOut, Plus, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

export function AppShell() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Accueil Athletic">
          <span className="brand-mark">
            <Activity aria-hidden="true" size={22} />
          </span>
          <span>
            <span className="brand-title">Athletic Performance</span>
            <span className="brand-subtitle">Journal sportif</span>
          </span>
        </NavLink>

        <nav className="topbar-actions" aria-label="Navigation">
          <span className="account-label" title={user?.email ?? 'Compte local'}>
            <UserRound size={16} aria-hidden="true" />
            <span>{user?.email ?? 'Compte local'}</span>
          </span>
          <a
            className="subtle-icon-button topbar-icon"
            href="../portal/index.html"
            title="Portail DailyMe"
            aria-label="Retour au portail DailyMe"
          >
            <Grid2X2 size={18} aria-hidden="true" />
          </a>
          <NavLink className="primary-button topbar-add" to="/new">
            <Plus size={17} aria-hidden="true" />
            Ajouter
          </NavLink>
          <button
            className="subtle-icon-button topbar-icon"
            type="button"
            title="Se deconnecter"
            aria-label="Se deconnecter"
            onClick={signOut}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
