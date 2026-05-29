import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { AppCategory, PersonalApp } from "../data/apps";

type Filter = "all" | AppCategory;

interface PortalHomeProps {
  apps: PersonalApp[];
}

const filters: Array<{ label: string; value: Filter }> = [
  { label: "Toutes", value: "all" },
  { label: "Productivité", value: "productivity" },
  { label: "Finance", value: "finance" },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function PortalHome({ apps }: PortalHomeProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const visibleApps = useMemo(() => {
    const normalizedQuery = normalize(query);

    return apps.filter((app) => {
      const matchesFilter =
        activeFilter === "all" || app.category === activeFilter;
      const matchesSearch = normalize(app.searchText).includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, apps, query]);

  return (
    <>
      <section className="dashboard-hero" aria-labelledby="portal-title">
        <div className="hero-copy">
          <p className="eyebrow">Portail personnel</p>
          <h1 id="portal-title">Toutes tes apps, au même endroit.</h1>
          <p>
            Une base responsive pour organiser tes futurs outils personnels, les
            retrouver rapidement et garder une architecture claire.
          </p>
        </div>

        <div className="hero-panel" aria-label="État du projet">
          <div>
            <span className="metric-label">Apps visibles</span>
            <strong>{apps.length}</strong>
          </div>
          <div>
            <span className="metric-label">Architecture</span>
            <strong>Monorepo</strong>
          </div>
          <div>
            <span className="metric-label">Stack</span>
            <strong>React</strong>
          </div>
        </div>
      </section>

      <section className="controls" aria-label="Recherche et filtres">
        <label className="search-box" htmlFor="app-search">
          <Search className="button-icon" aria-hidden="true" />
          <input
            id="app-search"
            type="search"
            placeholder="Rechercher une app"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="filter-group" role="group" aria-label="Filtrer les apps">
          {filters.map((filter) => (
            <button
              className={`filter-button ${
                activeFilter === filter.value ? "is-active" : ""
              }`}
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="apps-section" aria-labelledby="apps-title">
        <div className="section-heading">
          <div>
            <h2 id="apps-title">Applications</h2>
            <p>
              Ces deux apps sont des exemples visuels. Elles servent de modèle
              pour les prochaines apps.
            </p>
          </div>
          <span className="pill">
            <span className="status-dot blue" />
            Mobile ready
          </span>
        </div>

        {visibleApps.length > 0 ? (
          <div className="app-grid">
            {visibleApps.map((app) => (
              <article className="app-card" key={app.id}>
                <div className="app-card-top">
                  <div className={`app-icon ${app.category}-icon`}>
                    {app.initials}
                  </div>
                  <span className="app-status">{app.status}</span>
                </div>
                <span className="app-category">{app.categoryLabel}</span>
                <h3>{app.name}</h3>
                <p>{app.description}</p>
                <div className="tag-row" aria-label="Tags">
                  {app.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a className="card-link" href={app.route}>
                  Ouvrir
                  <ArrowUpRight className="button-icon" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Aucune app ne correspond à cette recherche.</p>
        )}
      </section>
    </>
  );
}
