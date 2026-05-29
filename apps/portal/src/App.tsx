import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Home, LayoutGrid } from "lucide-react";
import { BudgetPulseApp } from "../../budget-pulse/src/BudgetPulseApp";
import { FocusBoardApp } from "../../focus-board/src/FocusBoardApp";
import { personalApps, type AppId } from "./data/apps";
import { PortalHome } from "./views/PortalHome";
import "./styles.css";

type Route = "portal" | AppId;

const routeMap: Record<string, Route> = {
  "": "portal",
  "#/": "portal",
  "#/apps/focus-board": "focus-board",
  "#/apps/budget-pulse": "budget-pulse",
};

function readRoute(): Route {
  return routeMap[window.location.hash] ?? "portal";
}

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/");
    }

    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const currentApp = useMemo(
    () => personalApps.find((app) => app.id === route),
    [route],
  );

  return (
    <div className="page app-shell">
      <header className="topbar" aria-label="Navigation principale">
        <a className="brand" href="#/" aria-label="Accueil WebAppAlex">
          <span className="brand-mark">{currentApp?.initials ?? "WA"}</span>
          <span className="brand-text">
            <span className="brand-name">
              {currentApp?.name ?? "WebAppAlex"}
            </span>
            <span className="brand-caption">
              {currentApp?.caption ?? "Hub local d'applications"}
            </span>
          </span>
        </a>

        <nav className="nav-actions" aria-label="Actions du portail">
          <span className="pill">
            <span className="status-dot" />
            {personalApps.length} apps démo
          </span>

          {route !== "portal" ? (
            <a className="text-button" href="#/">
              <ArrowLeft className="button-icon" aria-hidden="true" />
              Portail
            </a>
          ) : (
            <span className="pill">
              <LayoutGrid className="button-icon" aria-hidden="true" />
              Monorepo React
            </span>
          )}

          <a className="icon-button" href="#/" title="Accueil">
            <Home className="button-icon" aria-hidden="true" />
            <span className="sr-only">Accueil</span>
          </a>
        </nav>
      </header>

      <main>
        {route === "portal" && <PortalHome apps={personalApps} />}
        {route === "focus-board" && <FocusBoardApp />}
        {route === "budget-pulse" && <BudgetPulseApp />}
      </main>

      <footer className="site-footer">
        <span>WebAppAlex</span>
        <span>Structure React initiale pour apps personnelles</span>
      </footer>
    </div>
  );
}
