# Environment

How to configure the frontend, and the backend settings it depends on. Copy `.env.example` to `.env.local` (git-ignored) for local work. Only `VITE_*` variables reach the browser bundle and they are baked in at build time; never put a secret in one.

## Frontend

| Variable | Used by | Development | Production | Notes |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | browser | `/api` | `/api` | Keep it same-origin. The session and CSRF cookies belong to the API's host, the app reads the CSRF cookie, and the CSP only allows `connect-src 'self'`. Serve the API under `/api` on the app's own host (reverse proxy). |
| `VITE_SUPPORT_PHONE` | browser (X3 Help) | empty | support line, `+2547…` | Empty hides "Call support". |
| `VITE_SUPPORT_WHATSAPP` | browser (X3) | empty | WhatsApp number | Empty hides "WhatsApp support". |
| `VITE_SUPPORT_EMAIL` | browser (X3) | empty | support address | Empty hides "Email support" and "Report a problem with this page". |
| `VITE_SUPPORT_HOURS` | browser (X3) | empty | `Every day, 8:00 to 20:00 EAT` | Shown under the contact buttons. |
| `VEKRO_API_TARGET` | Vite dev server | `http://127.0.0.1:8000` | not used | Where the dev server proxies `/api`. |
| `OPENAPI_URL` | `npm run api:sync` | `http://127.0.0.1:8000/openapi.json` | not used | Or `npm run api:sync -- --file path/to/openapi.json`. |
| `STITCH_API_KEY` | design tooling | your key, in `.env` | not used | Never committed or printed. |

### Tests

| Variable | Used by | Value |
| --- | --- | --- |
| `CI` | Playwright | set by CI: one retry, HTML report, no reuse of a running dev server |
| `PW_CHROMIUM_PATH` | Playwright | optional path to a local Chromium |
| `E2E_ADMIN_PHONE`, `E2E_ADMIN_PASSWORD` | console e2e | an admin made with `python -m app.cli create-admin`; without them the console specs skip |
| `PAYMENT_CALLBACK_SECRET` | e2e simulated M-Pesa callback | only if the backend sets one |

## Backend settings the frontend relies on

Full list in the backend's `.env.example`. These are the ones that decide whether the web app works:

| Backend variable | Development | Production | Why |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `development` | `production` | Production turns on the safety checks below. |
| `FRONTEND_URL` | `http://localhost:4173` | `https://app.vekro.co.ke` | Links in SMS messages; must be HTTPS in production. |
| `CORS_ORIGINS` | `http://localhost:4173` | `https://app.vekro.co.ke` | Same-origin through `/api` doesn't need CORS, but keep the app's origin listed. |
| `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | `false` | `true` | Required in production. |
| `SESSION_COOKIE_SAMESITE`, `CSRF_COOKIE_SAMESITE` | `lax` | `lax` | Same-origin requests carry them. |
| `CSRF_HEADER_NAME` | `X-CSRF-Token` | `X-CSRF-Token` | The frontend sends this header (`src/models/api/csrf.ts`). |
| `PHONE_CODE_DEV_ECHO` | `true` for local e2e | `false` (enforced) | Returns SMS codes in API responses for tests only. |
| `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`, `AFRICASTALKING_SENDER_ID` | `sandbox`, empty key (no SMS) | live account | Sign-in, payout and reset codes, and order messages. |
| `PAYMENT_CALLBACK_SECRET` | empty | set | The M-Pesa callback is refused in production without it. |

## Deployment headers

The built `index.html` carries the CSP as a meta tag. The web server should also send `Content-Security-Policy` with the value of `CSP_HEADER` in `src/app/csp.ts` (adds `frame-ancestors 'none'`), plus `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and long-lived caching for `/assets/*` only (file names are content-hashed; `index.html` and `sw.js` must not be cached).
