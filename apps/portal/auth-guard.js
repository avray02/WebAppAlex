import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const config = window.DAILYME_FIREBASE_CONFIG || {};
const hasFirebaseConfig = Boolean(config.apiKey && config.projectId && config.appId);
const canBypassAuth =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:";

let resolveAuthReady;

export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

if (!hasFirebaseConfig) {
  if (canBypassAuth) {
    finishAuthentication({
      status: "ready",
      mode: "demo",
      user: null,
      profile: { allowedApps: ["*"] },
      isAdmin: true,
      auth: null,
      db: null,
    });
  } else {
    window.location.replace(getLoginUrl());
  }
} else {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    void handleAuthState({ auth, db, user });
  });
}

async function handleAuthState({ auth, db, user }) {
  if (!user) {
    window.location.replace(getLoginUrl());
    return;
  }

  try {
    const [adminSnapshot, profileSnapshot] = await Promise.all([
      getDoc(doc(db, "admins", user.uid)),
      getDoc(doc(db, "users", user.uid)),
    ]);
    const isAdmin = adminSnapshot.exists();
    const profile = profileSnapshot.exists()
      ? parseProfile(profileSnapshot.data())
      : await createInitialProfile(db, user);
    const appId = document.documentElement.dataset.appId || "";
    const requiresAdmin = document.documentElement.dataset.requireAdmin === "true";

    if (requiresAdmin && !isAdmin) {
      window.location.replace(getPortalUrl("admin"));
      return;
    }

    if (appId && !isAdmin && !profile.allowedApps.includes(appId)) {
      window.location.replace(getPortalUrl("app", appId));
      return;
    }

    renderSession(user, auth);
    finishAuthentication({
      status: "ready",
      mode: "firebase",
      user,
      profile,
      isAdmin,
      auth,
      db,
    });
  } catch (error) {
    console.error("DailyMe authorization failed", error);
    showBlockingError(
      "Impossible de verifier les autorisations. Verifie Firestore et ses regles de securite.",
      auth,
    );
    finishAuthentication({ status: "error", error });
  }
}

async function createInitialProfile(db, user) {
  const profile = {
    email: user.email || "",
    displayName: user.displayName || "",
    allowedApps: [],
  };

  await setDoc(doc(db, "users", user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return profile;
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

function finishAuthentication(state) {
  document.documentElement.classList.remove("auth-pending");
  document.documentElement.classList.add("auth-ready");
  resolveAuthReady(state);
}

function getLoginUrl() {
  const basePath = getBasePath();
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${basePath}/apps/portal/login.html?redirect=${encodeURIComponent(redirect)}`;
}

function getPortalUrl(reason, appId = "") {
  const params = new URLSearchParams({ access: "denied", reason });

  if (appId) {
    params.set("app", appId);
  }

  return `${getBasePath()}/apps/portal/index.html?${params.toString()}`;
}

function getBasePath() {
  const marker = "/apps/";
  const index = window.location.pathname.indexOf(marker);

  if (index >= 0) {
    return window.location.pathname.slice(0, index) || "";
  }

  return window.location.pathname.replace(/\/[^/]*$/, "");
}

function renderSession(user, auth) {
  const targets = document.querySelectorAll("[data-auth-user]");
  targets.forEach((target) => {
    target.textContent = user.email || "Compte DailyMe";
  });

  const buttons = document.querySelectorAll("[data-auth-signout]");
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      await signOut(auth);
      window.location.replace(getLoginUrl());
    });
  });
}

function showBlockingError(message, auth) {
  const main = document.createElement("main");
  const panel = document.createElement("section");
  const title = document.createElement("h1");
  const description = document.createElement("p");
  const logoutButton = document.createElement("button");

  main.className = "login-page";
  panel.className = "login-panel";
  title.textContent = "Acces indisponible";
  description.textContent = message;
  logoutButton.className = "card-link";
  logoutButton.type = "button";
  logoutButton.textContent = "Revenir a la connexion";
  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace(getLoginUrl());
  });

  panel.append(title, description, logoutButton);
  main.append(panel);
  document.body.replaceChildren(main);
}
