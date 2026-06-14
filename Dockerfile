FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN set -eux; \
    printf 'Types: deb\nURIs: https://mirrors.ustc.edu.cn/debian\nSuites: bookworm bookworm-updates\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n\nTypes: deb\nURIs: https://mirrors.ustc.edu.cn/debian-security\nSuites: bookworm-security\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n' > /etc/apt/sources.list.d/debian.sources; \
    apt-get -o Acquire::https::Verify-Peer=false -o Acquire::Retries=5 update; \
    apt-get -o Acquire::https::Verify-Peer=false -o Acquire::Retries=5 install -y --no-install-recommends ca-certificates openssl; \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY public ./public

RUN mkdir -p .next /app/data/uploads && chown -R nextjs:nodejs .next /app/data

COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs package.json ./package.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
