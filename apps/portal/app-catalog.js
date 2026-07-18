export const APP_CATALOG = Object.freeze([
  Object.freeze({
    id: "focus-board",
    name: "Focus Board",
    category: "productivity",
    searchText: "focus board productivite planning taches",
    status: "Demo",
    initials: "FB",
    iconClass: "focus-icon",
    description:
      "Une vue de priorites pour organiser la journee, les taches et les prochaines actions.",
    tags: Object.freeze(["Planning", "Taches", "Routine"]),
    href: "../focus-board/index.html",
  }),
  Object.freeze({
    id: "budget-pulse",
    name: "Budget Pulse",
    category: "finance",
    searchText: "budget pulse finance depenses revenus",
    status: "Demo",
    initials: "BP",
    iconClass: "budget-icon",
    description:
      "Un tableau de bord personnel pour visualiser revenus, depenses et objectifs financiers.",
    tags: Object.freeze(["Budget", "Objectifs", "Suivi"]),
    href: "../budget-pulse/index.html",
  }),
  Object.freeze({
    id: "athletic-performance",
    name: "Athletic Performance",
    category: "sport",
    searchText:
      "athletic performance sport triathlon running trail cyclisme performances dashboard firebase",
    status: "React",
    initials: "AP",
    iconClass: "athletic-icon",
    description:
      "Une plateforme privee pour consulter, filtrer et creer tes performances sportives.",
    tags: Object.freeze(["Sport", "Dashboard", "Firebase"]),
    href: "../athletic-performance/",
  }),
]);

export const APP_IDS = Object.freeze(APP_CATALOG.map((app) => app.id));

export function findApp(appId) {
  return APP_CATALOG.find((app) => app.id === appId) ?? null;
}
