# Build from the repo root: `docker build -f services/api/Dockerfile .`
# Needed because this is an npm-workspaces monorepo - `npm ci` has to
# run at the root to resolve workspace links correctly, not inside
# services/api in isolation.

FROM node:22-alpine AS deps
WORKDIR /repo

# Only the manifests first, so this layer stays cached unless a
# dependency actually changed - this is the expensive step.
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
COPY services/api ./services/api
COPY packages ./packages
COPY tsconfig.base.json ./

RUN npm run build --workspace api


FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

# Production-only deps for the api workspace, kept separate from the
# build stage's full (dev + prod) install.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/api/package.json services/api/package.json
COPY packages ./packages
RUN npm ci --omit=dev --workspace api

COPY --from=build /repo/services/api/dist ./services/api/dist

# Don't run as root inside the container.
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "services/api/dist/server.js"]
