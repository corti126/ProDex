# AGENTS.md — Prodex

Compact guidance for future OpenCode sessions.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (HMR enabled) |
| `npm run build` | Build for production (`dist/`) |
| `npm run lint` | Run ESLint on all source files |
| `npm run preview` | Preview the production build locally |

> **Note**: No `test` script is defined in `package.json`. No Jest or test framework is configured.

## Firebase deploy

- Two GitHub Actions workflows exist (`.github/workflows/`):
  - `firebase-hosting-pull-request.yml` — builds and creates a PR preview
  - `firebase-hosting-merge.yml` — on push to `main`, deploys to the `live` channel
- Both run `npm ci && npm run build` then deploy via `FirebaseExtended/action-hosting-deploy`
- Required secrets: `FIREBASE_SERVICE_ACCOUNT_PRODEX_E010B`, `GITHUB_TOKEN`
- Project ID: `prodex-e010b` (from `.firebaserc`)

## Architecture & entrypoints

- **App entry**: `src/main.jsx` — renders React root with `BrowserRouter`
- **App component**: `src/App.jsx` — lazy-loads routes via `React.lazy`; 404 page for unknown paths
- **Routes** (lazy): `/pokemon`, `/pokemon/:name`, `/tipos`, `/movimientos`, `/partidas`
- **Data layer**: `src/api/pokeapi.js` — in-memory cached fetch client for PokéAPI
- **Firebase config**: `src/firebase.js` — embeds `firebaseConfig` directly (not env vars)
- **State persistence** (PartidasPage): `localStorage` key `pbh::partidas`; includes migration logic for old `{done, pokemon}` → new `{status, pokemon}` format
- **No TypeScript** — all files are JS/JSX; ESLint uses `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`

## Code styling

- **Prettier** config (`.prettierrc`): `printWidth: 100`, `semi: true`, `singleQuote: false`, `trailingComma: "all"`
- **ESLint**: flat config (`eslint.config.js`) with recommended JS rules, react-hooks, react-refresh; ignores `dist/`
- **.prettierignore**: `node_modules`, `dist`, `.output`, `.vinxi`, `pnpm-lock.yaml`, `package-lock.json`, `bun.lock`, `routeTree.gen.ts`

## Gotchas & quirks

- **PartidasPage saveState runs on every state update** (`useEffect` watches `state`); beware of infinite loops if state shape changes unexpectedly.
- **Firebase config is baked into source** — do not rotate or move it to env vars without updating `src/firebase.js`.
- **Lazy-loaded routes** use `Suspense` with a `Loader` component; do not remove the fallback without replacing it.
- **In-memory cache** in `pokeapi.js` (`MEM` Map) grows unbounded; consider TTL or size limits if the app scales.
- **404 route is a plain `<div>`, not a component** — keep it simple or refactor to a component.