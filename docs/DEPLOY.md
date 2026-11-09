# Deploying the web app

One site serves the app and the API: `https://app.vekro.co.ke` serves the static app and proxies `/api` to the backend. The backend can also have its own name (`api.vekro.co.ke`) for the M-Pesa and SMS callbacks, but the browser always talks to `/api` on the app's host. That keeps the session and CSRF cookies first-party (the app must read the CSRF cookie) and keeps the CSP's `connect-src` to `'self'` plus the anchoring RPC origin (docs/ENVIRONMENT.md).

## What's automated

- **Every PR**: CI builds the image and checks the rendered nginx config (`nginx -t`).
- **Every merge to `main`**: `.github/workflows/deploy.yml` builds `ghcr.io/ckmellow/vekro-web:<sha>` and `:latest` and publishes it, then calls `DEPLOY_HOOK_URL` if that secret is set.

The image (`Dockerfile`) builds the app, enforces the bundle budget, and serves `dist/` with nginx on port 8080 using `deploy/nginx.conf.template`: the CSP header, filled in at build time by `renderNginxTemplate` (`src/app/csp.ts`) so it matches the `<meta>` policy including the anchoring RPC origin (#294), HSTS, `nosniff`, a referrer and permissions policy, a year of caching for hashed assets, and no caching for `index.html` and the service worker.

## One-time setup (Cyprian)

1. **Host**: any container host that can pull from GHCR and offers a deploy hook (for example Render, Fly.io, Railway or a VPS with Coolify). Create a web service from `ghcr.io/ckmellow/vekro-web:latest` on port 8080, with `API_UPSTREAM` set to the backend's internal or public URL (for example `https://api.vekro.co.ke`).
2. **Registry access**: GHCR packages start private; give the host a token with `read:packages`, or make the package public.
3. **DNS and TLS**: point `app.vekro.co.ke` (and `api.vekro.co.ke` for the backend) at the host; enable HTTPS.
4. **Secrets and variables** in this repository: secret `DEPLOY_HOOK_URL` (the host's deploy hook); variables `VITE_SUPPORT_PHONE`, `VITE_SUPPORT_WHATSAPP`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_HOURS` (shown on the help page), and for the "Verified record" panel `VITE_ANCHOR_CHAIN_ID=84532`, `VITE_ANCHOR_REGISTRY_ADDRESS=0xD8094faf2B44711dD372A59C288130FA8113E4DB`, `VITE_ANCHOR_RPC_URL=https://sepolia.base.org` (Base Sepolia, backend `docs/anchoring.md` section 8; the panel stays hidden while any is empty).
5. **Backend** in production: `ENVIRONMENT=production`, `FRONTEND_URL=https://app.vekro.co.ke`, `CORS_ORIGINS=https://app.vekro.co.ke`, secure cookies, `PAYMENT_CALLBACK_SECRET`, live SMS keys, `PHONE_CODE_DEV_ECHO=false` (the backend refuses to start otherwise), and a support admin from `python -m app.cli create-admin`.

## Check after a deploy

```sh
curl -sI https://app.vekro.co.ke/ | grep -iE 'content-security-policy|strict-transport|cache-control'
curl -s https://app.vekro.co.ke/api/health
```

Then log in as a seller and confirm `/api/auth/me` returns 200 in the browser's network tab (cookies working), and that the order tracker updates.
