export type AppCategory = "productivity" | "finance";

export type AppId = "focus-board" | "budget-pulse";

export interface PersonalApp {
  id: AppId;
  name: string;
  initials: string;
  caption: string;
  category: AppCategory;
  categoryLabel: string;
  status: string;
  description: string;
  tags: string[];
  route: string;
  searchText: string;
}

export const personalApps: PersonalApp[] = [
  {
    id: "focus-board",
    name: "Focus Board",
    initials: "FB",
    caption: "Planification personnelle",
    category: "productivity",
    categoryLabel: "Productivité",
    status: "Démo",
    description:
      "Une vue de priorités pour organiser la journée, les tâches et les prochaines actions.",
    tags: ["Planning", "Tâches", "Routine"],
    route: "#/apps/focus-board",
    searchText: "focus board productivité planning tâches routine",
  },
  {
    id: "budget-pulse",
    name: "Budget Pulse",
    initials: "BP",
    caption: "Suivi financier personnel",
    category: "finance",
    categoryLabel: "Finance",
    status: "Démo",
    description:
      "Un tableau de bord personnel pour visualiser revenus, dépenses et objectifs financiers.",
    tags: ["Budget", "Objectifs", "Suivi"],
    route: "#/apps/budget-pulse",
    searchText: "budget pulse finance dépenses revenus objectifs suivi",
  },
];
