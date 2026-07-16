# AGENTS.md

This file is the durable project guide for Codex agents working on WebAppAlex.
Keep it accurate whenever the project structure, commands, architecture, or major
technical decisions change.

## Project Goal

WebAppAlex is a personal web application hub. Its first screen should act as a
clean, modern, responsive home page that gives access to all current and future
personal web apps stored in this repository.

The application must work well on desktop, tablet, and phone screens.

## Current State

The portal and demo apps are static HTML/CSS/vanilla JavaScript. The
`apps/athletic-performance` app is a React/TypeScript/Vite app using TailwindCSS,
Framer Motion, React Router, TanStack Query, React Hook Form, Zod, and Firebase
client SDK integration.

Current structure:

```text
index.html                 # Root redirect to the portal
apps/
  portal/
    index.html             # Main home page / launcher
    styles.css             # Portal-specific styles
    main.js                # Search and filter behavior
  focus-board/
    index.html             # Example personal app
    styles.css             # Focus Board styles
  budget-pulse/
    index.html             # Example personal app
    styles.css             # Budget Pulse styles
  athletic-performance/
    index.html             # React app entry
    src/                   # Feature-based React application
    public/legacy/         # Imported Athletic JSON, images, and bibs
    package.json           # Vite app commands and dependencies
packages/
  ui/
    theme.css              # Shared design tokens and base UI primitives
firestore.rules            # Firebase security rules for user-owned documents
storage.rules              # Firebase Storage rules for user media
```

When a framework, backend, test runner, deployment target, or shared package is
added, update this file with the real commands and confirmed folder structure.

## Target Architecture

Prefer a clear monorepo-style structure unless the project later adopts a more
specific framework convention:

```text
apps/
  portal/              # Main home page / launcher for all personal apps
  <app-name>/          # Future personal web apps
backend/               # Shared backend API, services, auth, data access
packages/
  ui/                  # Shared UI components and design primitives
  config/              # Shared lint, test, build, and TypeScript config
  types/               # Shared types and schemas
docs/                  # Product notes, decisions, architecture notes
```

Keep frontend and backend code separated:

- Frontend code owns routes, screens, components, client state, styling, and
  browser interactions.
- Backend code owns APIs, persistence, server-side validation, auth, and
  integrations.
- Shared contracts belong in a typed shared package or generated API types.
- Pages and routes should stay thin; move reusable UI and business logic into
  focused modules.
- Avoid coupling one personal app to another unless the dependency is deliberate
  and documented.

## Future Apps

When adding a new personal app:

- Put it in its own folder under `apps/<app-name>/`.
- Add an `index.html` and app-specific `styles.css` unless the project has
  adopted a different stack.
- Add or update the portal cards in `apps/portal/index.html` so the app appears
  from the home page with a category, tags, search text, and link.
- Keep app-specific logic inside that app folder.
- Extract shared components, utilities, schemas, or types only when at least two
  apps need them or the abstraction is clearly stable.
- Update this file if the new app changes the project structure, commands,
  routing model, backend surface, or deployment model.

## Design And Responsive Quality

The UI should feel elegant, modern, and practical. Favor clarity, spacing,
legibility, and predictable navigation over decorative complexity.

Responsive requirements:

- Support mobile, tablet, laptop, and desktop layouts.
- Verify important screens at minimum around these viewport sizes:
  `375x812`, `390x844`, `768x1024`, `1280x720`, and `1440x900`.
- Avoid text overlap, clipped labels, horizontal scrolling, and layout shifts.
- Use stable dimensions for repeated UI elements such as app cards, toolbars,
  grids, and buttons.
- Do not scale font size directly with viewport width.
- Prefer accessible contrast, visible focus states, semantic HTML, and keyboard
  navigation.
- Use real visual checks for significant UI changes, not only code inspection.

## Installed Skills To Use

Use these Codex skills when relevant:

- `define-goal`: use before fuzzy or large work to turn the request into a clear
  objective with success criteria.
- `screenshot`: use for visual inspection, UI comparison, and design feedback
  from screenshots.
- `playwright`: use to validate browser behavior, responsive layouts, and user
  flows.
- `playwright-interactive`: use when the task needs manual-like browser
  interaction, clicking through the app, or debugging a visual flow.
- `security-best-practices`: use for auth, API, data, dependency, deployment,
  secret handling, or other security-sensitive work.

If a skill is unavailable in the current session, continue with the best local
fallback and mention the limitation.

## Commands

Current static version:

```text
Open app:             open index.html or apps/portal/index.html in a browser
Install dependencies: cd apps/athletic-performance && npm install
Run dev server:       cd apps/athletic-performance && npm run dev
Visualize app:        open the HTML file directly in a browser
Lint:                 cd apps/athletic-performance && npm run lint
Typecheck:            not configured
Unit tests:           not configured
Build:                cd apps/athletic-performance && npm run build
E2E/responsive tests: not configured
```

To visualize the static portal during development, open either file directly:

```text
index.html
apps/portal/index.html
```

To visualize Athletic Performance, use the Vite dev server. The app runs in demo
mode without Firebase environment variables. Add `VITE_FIREBASE_*` values from
`apps/athletic-performance/.env.example` to enable Firebase Authentication,
Firestore, and Storage.

Before running commands, inspect the project files instead of guessing the
package manager or framework.

## Working Rules For Codex

- Read the existing code and conventions before editing.
- Keep changes scoped to the user's request.
- Do not introduce a new framework, package manager, database, or deployment
  target without a clear reason or user confirmation.
- For large features, first outline the proposed folder and module structure.
- Prefer simple, typed, maintainable code over clever abstractions.
- Add tests or browser checks when changing shared behavior, routing, responsive
  layout, API contracts, or data handling.
- Run the relevant verification commands when they exist.
- Report commands that could not be run and why.
- Never revert user changes unless the user explicitly asks.

## Security Rules

- Do not commit secrets, API keys, tokens, passwords, or local credentials.
- Keep environment-specific values in `.env` files or platform secret storage.
- Validate all backend inputs.
- Keep auth, authorization, and persistence logic on the server side.
- Avoid exposing internal paths, stack traces, or secrets to the client.
- For dependency, auth, API, or deployment changes, apply
  `security-best-practices` guidance.

## Maintenance Rule

Update this `AGENTS.md` when:

- A new personal app is added.
- The frontend or backend stack is initialized or changed.
- Project commands change.
- The folder structure changes.
- A major code refactor changes ownership boundaries.
- Deployment, environment, auth, data storage, or security assumptions change.
- A new recurring Codex workflow or skill usage rule becomes important.

The update should be small and factual. Do not let this file become a changelog;
keep it as current operating guidance for future sessions.
