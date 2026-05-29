import { PiggyBank, WalletCards } from "lucide-react";
import "./budget-pulse.css";

const stats = [
  { label: "Revenus", value: "3 200 €", progress: 82, tone: "blue" },
  { label: "Dépenses", value: "1 358 €", progress: 46, tone: "coral" },
  { label: "Épargne", value: "620 €", progress: 64, tone: "green" },
];

const categories = [
  { label: "Logement", value: "740 €" },
  { label: "Courses", value: "310 €" },
  { label: "Transport", value: "108 €" },
  { label: "Loisirs", value: "200 €" },
];

export function BudgetPulseApp() {
  return (
    <>
      <section className="budget-hero" aria-labelledby="budget-title">
        <div>
          <p className="pill">
            <span className="status-dot blue" />
            Mai
          </p>
          <h1 id="budget-title">Une vue claire de ton budget.</h1>
          <p>
            Une démo de dashboard pour suivre revenus, dépenses et objectifs
            sans surcharger l'interface.
          </p>
        </div>
        <div className="balance-card" aria-label="Solde disponible">
          <WalletCards className="panel-icon" aria-hidden="true" />
          <span>Solde disponible</span>
          <strong>1 842 €</strong>
          <small>+12 % vs mois dernier</small>
        </div>
      </section>

      <section className="stat-grid" aria-label="Indicateurs financiers">
        {stats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <div className={`bar ${stat.tone}`}>
              <i style={{ width: `${stat.progress}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="budget-grid">
        <article className="spending-panel">
          <div className="section-heading">
            <div>
              <h2>Catégories</h2>
              <p>Les postes principaux du mois.</p>
            </div>
          </div>
          <div className="category-list">
            {categories.map((category) => (
              <div key={category.label}>
                <span>{category.label}</span>
                <strong>{category.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="goal-panel">
          <div className="section-heading">
            <div>
              <h2>Objectif</h2>
              <p>Fonds vacances</p>
            </div>
            <PiggyBank className="panel-icon" aria-hidden="true" />
          </div>
          <div className="goal-ring" aria-label="Objectif atteint à 68 pour cent">
            <span>68%</span>
          </div>
          <p className="muted">1 360 € sur 2 000 €</p>
        </article>
      </section>
    </>
  );
}
