# Security pass (M16 #130)

| Area | Finding | Status |
| --- | --- | --- |
| Content Security Policy | None was set. | Strict same-origin CSP (`src/app/csp.ts`) injected into the built `index.html`; no `unsafe-eval`, no inline scripts, `object-src 'none'`. `CSP_HEADER` adds `frame-ancestors 'none'` and `upgrade-insecure-requests` for the deployment headers (M17 #134). Checked in a production build: no violations on the public pages. |
| Referrer | Browser default. | `strict-origin-when-cross-origin` meta in the built page. |
| Raw HTML | No `dangerouslySetInnerHTML` or `innerHTML`. | Guarded by `src/app/security.test.ts`. |
| Sessions | httpOnly session cookie and CSRF cookie set by the backend; `credentials: 'include'` and the CSRF header on unsafe methods. The backend refuses to start in production without `Secure` cookies, HTTPS origins and with `PHONE_CODE_DEV_ECHO` on. | Verified; guarded by tests in both repos. |
| Browser storage | Only the unfinished listing draft (no photos, tokens or personal data). | Kept, now cleared on sign out so a shared phone doesn't show it to the next person. Guarded by a test. |
| Logs | One `console.error`, dev builds only. No phone numbers or codes in frontend logs; the backend never logs SMS codes. | Guarded by a test. |
| Phones | Masked everywhere outside the admin console and the seller's own Settings fields. | Unchanged. |
| Dependencies (shipped) | `fast-uri` (via ajv in `@hookform/resolvers`): moderate. | Fixed (3.1.9); `npm audit --omit=dev` reports 0. |
| Dependencies (dev only) | Vitest 3 (`tinypool`, `@vitest/mocker`), Playwright 1.48, `@google/design.md` (old zod). Not shipped to users. | Need major upgrades (Vitest 5; Playwright 1.6x with new browsers in CI); left for a decision. |
