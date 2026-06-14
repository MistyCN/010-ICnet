# Stage 1: deps
FROM node:20-slim AS deps
WORKDIR /app

# better-sqlite3 has no prebuilt binary for this target and must be compiled,
# which needs python3 + a C/C++ toolchain. The default http Debian mirror is
# unreliable behind some proxies, so switch to an https mirror (USTC). The base
# image has no CA bundle yet, so TLS peer verification is disabled for this
# bootstrap apt run only (packages are still gpg-verified via Signed-By).
RUN set -eux; \
    printf 'Types: deb\nURIs: https://mirrors.ustc.edu.cn/debian\nSuites: bookworm bookworm-updates\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n\nTypes: deb\nURIs: https://mirrors.ustc.edu.cn/debian-security\nSuites: bookworm-security\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n' > /etc/apt/sources.list.d/debian.sources; \
    apt-get -o Acquire::https::Verify-Peer=false -o Acquire::Retries=5 update; \
    apt-get -o Acquire::https::Verify-Peer=false -o Acquire::Retries=5 install -y --no-install-recommends ca-certificates openssl python3 python-is-python3 build-essential; \
    rm -rf /var/lib/apt/lists/*

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: builder
FROM deps AS builder
COPY . .

ARG DATABASE_URL="file:./dev.db"
ENV DATABASE_URL=$DATABASE_URL

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1

RUN set -eux; \
    printf 'Types: deb\nURIs: https://mirrors.ustc.edu.cn/debian\nSuites: bookworm bookworm-updates\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n\nTypes: deb\nURIs: https://mirrors.ustc.edu.cn/debian-security\nSuites: bookworm-security\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n' > /etc/apt/sources.list.d/debian.sources; \
    apt-get -o Acquire::https::Verify-Peer=false -o Acquire::Retries=5 update; \
    apt-get -o Acquire::https::Verify-Peer=false -o Acquire::Retries=5 install -y --no-install-recommends ca-certificates openssl; \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create data directory for SQLite database and uploads
RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
