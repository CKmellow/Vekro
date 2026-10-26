# End-to-end tests

Playwright against the real backend (CKmellow/Vekro-backend) through the Vite dev server. CI runs every spec on each PR (`.github/workflows/ci.yml`, job "End-to-end"); on failure it uploads the HTML report and `test-results` (traces, screenshots).

| Spec | Flow |
| --- | --- |
| `pay.spec.ts` | seller lists, buyer pays into escrow; a cancelled M-Pesa prompt |
| `door.spec.ts` | accept a standard item (released), accept a serial-numbered item (held 24h), reject at the door (refund) |
| `release.spec.ts` | seller dispatches and marks arrival in the app, buyer accepts, seller paid |
| `dispute.spec.ts` | buyer reports a fault, returns it, seller repairs, buyer confirms |
| `returns.spec.ts` | seller refunds a return; seller repairs a return |
| `console.spec.ts` | support resolves an escalated return from the console (typed confirmation), buyer refunded |
| `sign-in.spec.ts` | buyer SMS sign-in; phone gate on an order link; seller password reset by SMS |
| `account.spec.ts` | buyer My orders and track by reference; seller payout number change by SMS code |
| `a11y.spec.ts` | axe on every page (public, buyer, seller, console) |

Backend settings the suite needs (CI sets them): `PHONE_CODE_DEV_ECHO=true` (codes come back in the API response; refused in production) and a support admin from `python -m app.cli create-admin`, passed as `E2E_ADMIN_PHONE` and `E2E_ADMIN_PASSWORD`. Without them the console specs skip.

Run locally: start the backend on :8000, then `npm run e2e` (or `npx playwright test e2e/console.spec.ts`). Traces of failures are in `test-results/`; open one with `npx playwright show-trace <trace.zip>`.
