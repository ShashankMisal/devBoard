FROM node:18-alpine AS base

WORKDIR /usr/src/app

FROM base AS deps

# Installing all dependencies in a dedicated stage keeps the final runtime image smaller and easier to audit.
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder

# Copying the full project only after dependency install maximizes Docker layer reuse during local rebuilds.
COPY . .

FROM node:18-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Production images should only carry runtime dependencies, not test and build tooling.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Running as a dedicated unprivileged user reduces the blast radius of a compromised container.
RUN addgroup -S nodejs && adduser -S devboard -G nodejs

COPY --from=builder /usr/src/app/index.js ./index.js
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/eslint.config.js ./eslint.config.js

RUN mkdir -p logs && chown -R devboard:nodejs /usr/src/app

USER devboard

EXPOSE 5000

ENTRYPOINT ["node", "index.js"]
