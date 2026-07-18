import { firebaseMode, useAuth } from '@webappalex/auth'
import { Activity, LogOut, Plus, ShieldCheck } from 'lucide-react'
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
            <span className="brand-subtitle">Training records platform</span>
          </span>
        </NavLink>

        <nav className="topbar-actions" aria-label="Navigation">
          <span className="session-pill">
            <ShieldCheck size={16} aria-hidden="true" />
            {firebaseMode === 'firebase' ? 'Firebase' : 'Demo local'}
          </span>
          <NavLink className="action-button" to="/new">
            <Plus size={17} aria-hidden="true" />
            Nouvelle performance
          </NavLink>
          <button className="icon-button" type="button" onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
            <span className="sr-only">Deconnexion de {user?.displayName}</span>
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
