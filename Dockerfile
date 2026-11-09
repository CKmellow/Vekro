# Vekro web app (M17 #134): build with Node, serve with nginx (security headers, /api proxy).
FROM node:22.17-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
# VITE_* values are baked in at build time (docs/ENVIRONMENT.md).
ARG VITE_SUPPORT_PHONE= VITE_SUPPORT_WHATSAPP= VITE_SUPPORT_EMAIL= VITE_SUPPORT_HOURS=
# The "Verified record" panel's registry (#294); empty hides the panel. The RPC origin joins the CSP.
ARG VITE_ANCHOR_CHAIN_ID= VITE_ANCHOR_REGISTRY_ADDRESS= VITE_ANCHOR_RPC_URL=
ENV VITE_API_BASE_URL=/api
RUN npm run build && npm run budget

FROM nginx:1.27-alpine
# nginx renders /etc/nginx/templates/*.template with the container's environment at start-up.
# The build already filled in the CSP header (.deploy/, from deploy/nginx.conf.template).
COPY --from=build /app/.deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:8000 NGINX_ENVSUBST_FILTER=API_UPSTREAM
EXPOSE 8080
