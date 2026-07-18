import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const config = window.WEBAPPALEX_FIREBASE_CONFIG || {};
const hasFirebaseConfig = Boolean(config.apiKey && config.projectId && config.appId);

if (!hasFirebaseConfig) {
  document.documentElement.classList.remove("auth-pending");
} else {
  const app = initializeApp(config);
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace(getLoginUrl());
      return;
    }

    document.documentElement.classList.remove("auth-pending");
    document.documentElement.classList.add("auth-ready");
    renderSession(user, auth);
  });
}

function getLoginUrl() {
  const basePath = getBasePath();
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${basePath}/apps/portal/login.html?redirect=${encodeURIComponent(redirect)}`;
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
    target.textContent = user.email || "Compte WebAppAlex";
  });

  const buttons = document.querySelectorAll("[data-auth-signout]");
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      await signOut(auth);
      window.location.replace(getLoginUrl());
    });
  });
}
