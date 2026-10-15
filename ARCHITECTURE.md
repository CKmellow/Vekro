# Architecture

The Vekro frontend is a React single-page app split into Model, View and Controller layers. ESLint enforces the boundaries (`eslint.config.js`), and `scripts/check-boundaries.mjs` proves the rules reject violations.

## Layers

```
src/
  app/          router, providers, route guards, error boundary
  models/
    api/        generated OpenAPI types, the typed fetch client, error mapping
      adapters/ the only code that knows about backend gaps (mocks, flags, normalizers)
    schemas/    Zod schemas for forms and API payloads
    domain/     pure rules: STATE_META, getAvailableActions, deadlines
    queries/    TanStack Query hooks and query keys
  controllers/  one hook per screen or feature
  views/
    pages/      route-level screens: buyer, seller, admin, shared
    components/ ui (primitives) and domain (VaultCard, MoneyPath, ...)
    layouts/    buyer, seller and admin shells
  lib/          dependency-free helpers: money, phone, time, copy
  styles/       design tokens generated from DESIGN.md
  mocks/        MSW handlers for tests and backend gaps
```

## Import rules

| Layer | May import | Must not import |
| --- | --- | --- |
| `views` | `controllers`, `lib`, other `views` | `models`, `fetch` |
| `controllers` | `models`, `lib` | `views`, JSX, `fetch` |
| `models` | `lib` (and `models/api` for other models) | `controllers`, `views`, `app`; only `models/api` may call `fetch` |
| `lib` | nothing from the app | everything in `src` except `lib` |
| `app` | everything | n/a |

A page component in `views/pages` calls its controller hook and passes the result to presentational components. The controller owns queries, mutations, validation and polling, and returns plain props and callbacks. Presentational components never know where data comes from.

## Data flow

```
route (app/router)
  -> page view (views/pages/*)          renders props, calls callbacks
       -> controller hook (controllers/*) orchestrates, validates, polls
            -> query hooks (models/queries) TanStack Query cache
                 -> api client (models/api)   typed fetch, cookies, CSRF, error mapping
                      -> adapters (models/api/adapters) gap mocks and normalizers
                           -> backend (api/openapi.json is the contract)
```

## Backend gaps

When the contract lacks something a screen needs, the adapter layer provides it behind a `VITE_MOCK_<GAP>` flag with an MSW handler tagged `// backend-gap #<issue>`. Screens and controllers never know whether data is mocked. When the backend ships the capability, delete the mock and the flag; nothing else changes. The index lives in `docs/BACKEND_GAPS.md`.

## Auth and API rules

- Sellers and admins use server-side sessions in cookies with CSRF. Requests use `credentials: "include"` and send the CSRF header on unsafe methods. Nothing is stored in browser storage, and there is no JWT.
- Global handling: 401 goes to login with a return URL; 403 shows a friendly page; 409 refetches and shows a toast; 422 maps to field errors; network failure shows a banner.
- Countdowns use server deadlines, never the device clock.
- The backend `TransactionStatus` enum is the authority; `STATE_META` maps it to human labels.

## Design

Tokens come from `.stitch/DESIGN.md` through `npm run tokens` and are committed in `src/styles/`. The approved Stitch designs live in `design/`.
