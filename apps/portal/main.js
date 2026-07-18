import { APP_CATALOG, findApp } from "./app-catalog.js";
import { authReady } from "./auth-guard.js";

const searchInput = document.querySelector("#app-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const appGrid = document.querySelector("#app-grid");
const emptyState = document.querySelector("#empty-state");
let accessibleApps = [];
let activeFilter = "all";

void initializePortal();

async function initializePortal() {
  const session = await authReady;

  if (session.status !== "ready") {
    return;
  }

  const allowedApps = new Set(session.profile.allowedApps);
  accessibleApps = session.isAdmin || allowedApps.has("*")
    ? APP_CATALOG
    : APP_CATALOG.filter((app) => allowedApps.has(app.id));

  renderApps(accessibleApps);
  updateAppCounts(accessibleApps.length);
  showAdminLink(session.isAdmin);
  showAccessNotice();
  bindControls();
  updateCards();
}

function renderApps(apps) {
  if (!appGrid) {
    return;
  }

  appGrid.replaceChildren(...apps.map(createAppCard));
}

function createAppCard(app) {
  const card = document.createElement("article");
  const cardTop = document.createElement("div");
  const icon = document.createElement("div");
  const status = document.createElement("span");
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const tags = document.createElement("div");
  const link = document.createElement("a");
  const arrow = document.createElement("span");

  card.className = "app-card";
  card.dataset.appId = app.id;
  card.dataset.name = app.searchText;
  card.dataset.category = app.category;
  cardTop.className = "app-card-top";
  icon.className = `app-icon ${app.iconClass}`;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = app.initials;
  status.className = "app-status";
  status.textContent = app.status;
  title.textContent = app.name;
  description.textContent = app.description;
  tags.className = "tag-row";
  tags.setAttribute("aria-label", "Tags");

  app.tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.textContent = tag;
    tags.append(tagElement);
  });

  link.className = "card-link";
  link.href = app.href;
  link.append("Ouvrir ");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "->";
  link.append(arrow);
  cardTop.append(icon, status);
  card.append(cardTop, title, description, tags, link);

  return card;
}

function bindControls() {
  searchInput?.addEventListener("input", updateCards);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";

      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

      updateCards();
    });
  });
}

function updateCards() {
  const query = normalize(searchInput?.value || "");
  const cards = Array.from(document.querySelectorAll(".app-card"));
  let visibleCount = 0;

  cards.forEach((card) => {
    const matchesFilter =
      activeFilter === "all" || card.dataset.category === activeFilter;
    const matchesSearch = normalize(card.dataset.name || "").includes(query);
    const isVisible = matchesFilter && matchesSearch;

    card.hidden = !isVisible;
    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (emptyState) {
    emptyState.textContent = accessibleApps.length
      ? "Aucune app ne correspond a cette recherche."
      : "Aucune application ne vous a encore ete attribuee.";
    emptyState.hidden = visibleCount > 0;
  }
}

function updateAppCounts(count) {
  document.querySelectorAll("[data-app-count]").forEach((element) => {
    element.textContent = `${count} app${count > 1 ? "s" : ""}`;
  });
  document.querySelectorAll("[data-visible-app-count]").forEach((element) => {
    element.textContent = String(count);
  });
}

function showAdminLink(isAdmin) {
  document.querySelectorAll("[data-admin-link]").forEach((element) => {
    element.hidden = !isAdmin;
  });
}

function showAccessNotice() {
  const params = new URLSearchParams(window.location.search);
  const notice = document.querySelector("[data-access-notice]");

  if (!notice || params.get("access") !== "denied") {
    return;
  }

  const deniedApp = findApp(params.get("app"));
  notice.textContent = deniedApp
    ? `Ton compte n'a pas acces a ${deniedApp.name}.`
    : "Ton compte ne dispose pas de cette autorisation.";
  notice.hidden = false;
}

function normalize(value) {
  return value.trim().toLowerCase();
}
