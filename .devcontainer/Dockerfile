# Development image for the react-virtuoso monorepo.
# Keep NODE_VERSION in line with .github/workflows, PNPM_VERSION with "packageManager" in package.json, and
# PLAYWRIGHT_VERSION with the version pnpm-lock.yaml resolves for the `playwright` catalog entry.
ARG NODE_VERSION=24.18.0
FROM node:${NODE_VERSION}-bookworm

ARG PNPM_VERSION=12.5.1
ARG PLAYWRIGHT_VERSION=1.60.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ripgrep jq less procps ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# System libraries for Chromium need root, so they live in the image. The browser binary itself is installed by
# postCreateCommand into PLAYWRIGHT_BROWSERS_PATH, which can be a persistent cache.
RUN npx -y playwright@${PLAYWRIGHT_VERSION} install-deps chromium \
  && rm -rf /var/lib/apt/lists/* /root/.npm

# Activate pnpm through corepack for every user. COREPACK_HOME keeps the downloaded pnpm readable by the
# non-root `node` user that the container runs as.
ENV COREPACK_HOME=/usr/local/share/corepack
RUN corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate \
  && chmod -R a+rwX ${COREPACK_HOME}

USER node

# pnpm 12 is a launcher that downloads its native binary on first use; fetch it once at build time.
RUN pnpm --version
