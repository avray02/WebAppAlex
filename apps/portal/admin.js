import {
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { APP_CATALOG, APP_IDS } from "./app-catalog.js";
import { authReady } from "./auth-guard.js";

const userList = document.querySelector("[data-user-list]");
const userCount = document.querySelector("[data-user-count]");
const statusMessage = document.querySelector("[data-admin-status]");
const refreshButton = document.querySelector("[data-users-refresh]");

refreshButton?.addEventListener("click", () => {
  void loadUsers();
});

void initializeAdmin();

async function initializeAdmin() {
  const session = await authReady;

  if (session.status !== "ready" || !session.isAdmin) {
    return;
  }

  if (!session.db) {
    showStatus("La gestion des acces est disponible avec Firebase en ligne.", true);
    if (userCount) {
      userCount.textContent = "Mode local";
    }
    return;
  }

  await loadUsers(session.db);
}

async function loadUsers(database) {
  const session = await authReady;
  const db = database || session.db;

  if (!db || !userList) {
    return;
  }

  setRefreshState(true);
  showStatus("");

  try {
    const snapshot = await getDocs(collection(db, "users"));
    const profiles = snapshot.docs
      .map((profileDocument) => ({
        uid: profileDocument.id,
        ...parseProfile(profileDocument.data()),
      }))
      .sort((left, right) => left.email.localeCompare(right.email, "fr"));

    userList.replaceChildren(...profiles.map((profile) => createUserForm(db, profile)));

    if (userCount) {
      userCount.textContent = `${profiles.length} compte${profiles.length > 1 ? "s" : ""}`;
    }

    if (profiles.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "Aucun utilisateur ne s'est encore connecte.";
      userList.append(emptyState);
    }
  } catch (error) {
    console.error("Unable to load DailyMe users", error);
    showStatus("Impossible de charger les utilisateurs.", true);
  } finally {
    setRefreshState(false);
  }
}

function createUserForm(db, profile) {
  const form = document.createElement("form");
  const identity = document.createElement("div");
  const name = document.createElement("h3");
  const email = document.createElement("p");
  const uid = document.createElement("code");
  const permissions = document.createElement("fieldset");
  const legend = document.createElement("legend");
  const permissionGrid = document.createElement("div");
  const actions = document.createElement("div");
  const saveButton = document.createElement("button");
  const feedback = document.createElement("span");
  const allowedApps = new Set(profile.allowedApps);

  form.className = "user-access-item";
  identity.className = "user-identity";
  name.textContent = profile.displayName || profile.email || "Compte sans nom";
  email.textContent = profile.email || "Email indisponible";
  uid.textContent = profile.uid;
  permissions.className = "permission-fieldset";
  legend.textContent = "Applications autorisees";
  permissionGrid.className = "permission-grid";

  APP_CATALOG.forEach((app) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const labelText = document.createElement("span");

    checkbox.type = "checkbox";
    checkbox.name = "allowedApps";
    checkbox.value = app.id;
    checkbox.checked = allowedApps.has(app.id);
    labelText.textContent = app.name;
    label.append(checkbox, labelText);
    permissionGrid.append(label);
  });

  actions.className = "user-access-actions";
  saveButton.className = "card-link";
  saveButton.type = "submit";
  saveButton.textContent = "Enregistrer";
  feedback.className = "save-feedback";
  feedback.setAttribute("role", "status");
  identity.append(name, email, uid);
  permissions.append(legend, permissionGrid);
  actions.append(saveButton, feedback);
  form.append(identity, permissions, actions);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    feedback.textContent = "Enregistrement...";

    const formData = new FormData(form);
    const selectedApps = formData
      .getAll("allowedApps")
      .map(String)
      .filter((appId) => APP_IDS.includes(appId));

    try {
      await updateDoc(doc(db, "users", profile.uid), {
        allowedApps: selectedApps,
        updatedAt: serverTimestamp(),
      });
      feedback.textContent = "Acces mis a jour.";
    } catch (error) {
      console.error("Unable to update app access", error);
      feedback.textContent = "Echec de l'enregistrement.";
    } finally {
      saveButton.disabled = false;
    }
  });

  return form;
}

function parseProfile(data) {
  return {
    email: typeof data.email === "string" ? data.email : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    allowedApps: Array.isArray(data.allowedApps)
      ? data.allowedApps.filter((appId) => typeof appId === "string")
      : [],
  };
}

function showStatus(message, isError = false) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.hidden = !message;
  statusMessage.classList.toggle("is-error", isError);
}

function setRefreshState(isLoading) {
  if (refreshButton) {
    refreshButton.disabled = isLoading;
    refreshButton.textContent = isLoading ? "Chargement..." : "Actualiser";
  }
}
