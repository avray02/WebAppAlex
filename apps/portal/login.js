import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const config = window.WEBAPPALEX_FIREBASE_CONFIG || {};
const hasFirebaseConfig = Boolean(config.apiKey && config.projectId && config.appId);
const form = document.querySelector("[data-login-form]");
const errorMessage = document.querySelector("[data-login-error]");
const submitButton = document.querySelector("[data-login-submit]");

if (!hasFirebaseConfig) {
  setError(
    "Configuration Firebase absente. GitHub Pages sert probablement les sources du repo au lieu du build Actions.",
  );
  if (submitButton) {
    submitButton.disabled = true;
  }
} else {
  const app = initializeApp(config);
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.replace(getRedirectPath());
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      if (submitButton) {
        submitButton.disabled = true;
      }
      await signInWithEmailAndPassword(auth, email, password);
      window.location.replace(getRedirectPath());
    } catch {
      setError("Connexion impossible avec ces identifiants.");
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

function getRedirectPath() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  const fallback = `${getBasePath()}/apps/portal/index.html`;

  if (!redirect || !redirect.startsWith("/")) {
    return fallback;
  }

  try {
    const target = new URL(redirect, window.location.origin);
    const basePath = getBasePath();
    const isAllowedPath =
      target.origin === window.location.origin &&
      target.pathname.startsWith(`${basePath}/apps/`);

    return isAllowedPath
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

function getBasePath() {
  const marker = "/apps/";
  const index = window.location.pathname.indexOf(marker);

  if (index >= 0) {
    return window.location.pathname.slice(0, index) || "";
  }

  return window.location.pathname.replace(/\/[^/]*$/, "");
}

function setError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.hidden = !message;
  }
}
