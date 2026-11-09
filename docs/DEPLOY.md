# Deploying the web app

One site serves the app and the API: `https://app.vekro.me` serves the static app and proxies `/api` to the backend. The backend can also have its own name (`api.vekro.me`) for the M-Pesa and SMS callbacks, but the browser always talks to `/api` on the app's host. That keeps the session and CSRF cookies first-party (the app must read the CSRF cookie) and keeps the CSP's `connect-src` to `'self'` plus the anchoring RPC origin (docs/ENVIRONMENT.md).

## What's automated

- **Every PR**: CI builds the image and checks the rendered nginx config (`nginx -t`).
- **Every merge to `main`**: `.github/workflows/deploy.yml` builds `ghcr.io/ckmellow/vekro-web:<sha>` and `:latest` and publishes it. Once the repository variable `DEPLOY_ENABLED` is `true`, it then rolls the image out on the VM over SSH with the backend's `deploy/deploy.sh web <sha>` (pull, restart, health check, automatic rollback) (#296).

The image (`Dockerfile`) builds the app, enforces the bundle budget, and serves `dist/` with nginx on port 8080 using `deploy/nginx.conf.template`: the CSP header, filled in at build time by `renderNginxTemplate` (`src/app/csp.ts`) so it matches the `<meta>` policy including the anchoring RPC origin (#294), HSTS, `nosniff`, a referrer and permissions policy, a year of caching for hashed assets, and no caching for `index.html` and the service worker.

## One-time setup (Cyprian)

1. **Host**: one Azure VM running the backend's Compose stack, which includes this image as the `web` service behind a Cloudflare Tunnel. The full setup and go-live checklist is the backend's `docs/hosting.md`.
2. **Registry access**: GHCR packages start private. Make `vekro-web` public (it holds only public build values), or log the VM in with a token that has only `read:packages`.
3. **DNS and TLS**: `app.vekro.me` (and `api.vekro.me` for the backend) are tunnel hostnames in Cloudflare; Cloudflare serves HTTPS (backend `docs/hosting.md` sections 2 and 4).
4. **Secrets and variables** in this repository, the same as the backend's (`docs/hosting.md` section 7): environment `production`; variables `DEPLOY_ENABLED`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`; secrets `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, and `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` for SSH through Cloudflare Access. Build variables `VITE_SUPPORT_PHONE`, `VITE_SUPPORT_WHATSAPP`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_HOURS` (shown on the help page), and for the "Verified record" panel `VITE_ANCHOR_CHAIN_ID=84532`, `VITE_ANCHOR_REGISTRY_ADDRESS=0xD8094faf2B44711dD372A59C288130FA8113E4DB`, `VITE_ANCHOR_RPC_URL=https://sepolia.base.org` (Base Sepolia, backend `docs/anchoring.md` section 8; the panel stays hidden while any is empty).
5. **Backend** in production: `ENVIRONMENT=production`, `FRONTEND_URL=https://app.vekro.me`, `CORS_ORIGINS=https://app.vekro.me`, secure cookies, `PAYMENT_CALLBACK_SECRET`, live SMS keys, `PHONE_CODE_DEV_ECHO=false` (the backend refuses to start otherwise), and a support admin from `python -m app.cli create-admin`.

## Check after a deploy

```sh
curl -sI https://app.vekro.me/ | grep -iE 'content-security-policy|strict-transport|cache-control'
curl -s https://app.vekro.me/api/health
```

Then log in as a seller and confirm `/api/auth/me` returns 200 in the browser's network tab (cookies working), and that the order tracker updates.
