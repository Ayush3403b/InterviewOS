# Build from the repo root: `docker build -f apps/web/Dockerfile .`
# Same npm-workspaces reasoning as services/api/Dockerfile.

FROM node:22-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/api/package.json services/api/package.json
COPY packages ./packages

RUN npm ci


FROM node:22-alpine AS build
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/package.json ./package.json
COPY package-lock.json ./
COPY apps/web ./apps/web
COPY packages ./packages
COPY tsconfig.base.json ./

# Same-origin API URL by default (see nginx.conf's /api proxy) - override
# at build time with --build-arg if the API lives on a different origin.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace web


FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
