import { CalendarCheck, CheckCircle2 } from "lucide-react";
import "./focus-board.css";

const schedule = [
  {
    time: "09:00",
    title: "Deep work",
    description: "Finaliser la fonctionnalité principale.",
  },
  {
    time: "13:30",
    title: "Revue",
    description: "Relire, tester et corriger les points visibles.",
  },
  {
    time: "17:00",
    title: "Préparation",
    description: "Noter les prochaines actions avant demain.",
  },
];

const tasks = [
  { label: "Vérifier le rendu mobile", done: true },
  { label: "Ajouter les données réelles", done: false },
  { label: "Documenter la prochaine itération", done: false },
];

export function FocusBoardApp() {
  return (
    <div className="focus-layout">
      <section className="focus-summary" aria-labelledby="focus-title">
        <p className="pill">
          <span className="status-dot" />
          Aujourd'hui
        </p>
        <h1 id="focus-title">Priorités nettes, journée lisible.</h1>
        <p>
          Une démo pour visualiser comment une future app peut garder un usage
          simple sur ordinateur comme sur téléphone.
        </p>
      </section>

      <section className="plan-panel" aria-label="Planning du jour">
        <div className="section-heading">
          <div>
            <h2>Planning</h2>
            <p>Trois blocs de travail pour garder le rythme.</p>
          </div>
          <CalendarCheck className="panel-icon" aria-hidden="true" />
        </div>

        <div className="timeline">
          {schedule.map((item) => (
            <article key={item.time}>
              <span>{item.time}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="task-panel" aria-label="Tâches">
        <div className="section-heading">
          <div>
            <h2>Tâches</h2>
            <p>Une liste volontairement courte et actionnable.</p>
          </div>
          <CheckCircle2 className="panel-icon" aria-hidden="true" />
        </div>

        <div className="task-list">
          {tasks.map((task) => (
            <label key={task.label}>
              <input type="checkbox" defaultChecked={task.done} />
              <span>{task.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
