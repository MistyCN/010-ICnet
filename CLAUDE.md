# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # dev server on http://localhost:3000
npm run build      # production build (output: "standalone" -> .next/standalone + .next/static)
npm run start      # serve the production build
npm run lint       # eslint (flat config, eslint.config.mjs) 鈥?no test runner is configured
npm run db:migrate # node scripts/migrate-db.js 鈥?creates/updates the SQLite schema (idempotent CREATE TABLE IF NOT EXISTS)
```

There is **no test suite** and **no `db:generate` / `db:studio` script** (the README mentions them, but only `db:migrate` exists in `package.json`). The Drizzle schema is defined inline in `lib/db.ts`, not managed by Drizzle's migration tooling 鈥?`scripts/migrate-db.js` hand-mirrors the same schema with raw SQL and is the actual source of truth for the on-disk tables. Keep both in sync when changing columns.

## Stack & the Next.js caveat

Next.js **16.2.9** with React **19.2**, App Router, TypeScript, Tailwind **v4** (`@tailwindcss/postcss`), Drizzle ORM over `better-sqlite3`, NextAuth v4. `next.config.ts` sets `output: "standalone"`.

As `AGENTS.md` warns: this Next.js has breaking changes vs. training-data Next.js. Before writing route/server code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app/`, `02-pages/`, `03-architecture/`). Don't assume App Router conventions from memory.

## Architecture

This is the **InfCraft / 鏃犻檺澶ч檰** Minecraft server website (Chinese-language UI). Two concerns: a marketing site and a lightweight discussion forum with Minecraft-ID auth.

**Config & content (edit these, not the pages):**
- `config/site.ts` 鈥?single source for site name, nav links, server IP/port, `features` array, and `socialLinks`. Feature descriptions starting with `TODO:` auto-render as grey "寰呰ˉ鍏? placeholder cards. Social links set to `null` render as "寰呰ˉ鍏?. Never fabricate copy 鈥?see README's 鏂囨涓庡叕鍛婄淮鎶よ鑼?
- `content/news.ts` 鈥?static announcements. Keep `newsList` as `[]` when there's nothing to publish; the UI renders an empty state.

**Minecraft server status:**
- `lib/minecraft/status.ts` pings the Java Edition server via `minecraft-server-util` (TCP). It keeps a **module-level in-memory cache** (30s on success, 2s on error) - no Redis. Multi-instance deployments have independent caches.
- The displayed address and queried address are both configured by `NEXT_PUBLIC_SERVER_IP` / `NEXT_PUBLIC_SERVER_PORT`. If the displayed port is `25565`, the API resolves the Minecraft SRV record for that displayed domain and then pings the resolved target, matching how Minecraft clients connect to a bare domain. If a non-default port is displayed, the API pings that exact `host:port`.
- `/api/server-status` is `runtime = "nodejs"`, `dynamic = "force-dynamic"`, and sets no-store headers. Supports `?force=true` to bypass cache.

**Auth (offline Minecraft-ID, no email):**
- `lib/auth.ts` 鈥?NextAuth v4 Credentials provider, JWT sessions (30 days). Users register with only a Minecraft ID + password; there is **no Mojang/Microsoft verification** and **no email**. Passwords hashed with bcrypt (`lib/passwords.ts`).
- `types/next-auth.d.ts` augments `Session`/`JWT`/`User` with `minecraftId` and `role`. The `role` field (`USER` default) exists on the User table but is not yet wired to access control.
- `lib/validators.ts` enforces Minecraft ID (3鈥?6 chars, `[A-Za-z0-9_]`) and password (鈮?) rules 鈥?reused by both the register API and the login authorize callback.
- `lib/data.ts` 鈥?`findUserByMinecraftIdCaseInsensitive` does a prefix `LIKE` then in-JS lowercased compare (SQLite default collation is case-sensitive on this column).

**Database (`lib/db.ts` + `lib/data.ts`):**
- Single `better-sqlite3` connection, cached on `globalThis` to survive HMR in dev. `DATABASE_URL` is a `file:` URL; both `lib/db.ts` and `scripts/migrate-db.js` strip the `file:` prefix.
- Tables: `User`, `Discussion`, `Reply`, `Poll`, `PollOption`, `PollVote` (foreign keys `ON`, cascade deletes). `Poll` is 1:1 per discussion; `PollVote` has a unique `(userId, pollId)` index 鈥?one vote per user per poll.
- `lib/data.ts` mixes Drizzle query builder for reads with raw `sqlite.prepare()` + `sqlite.transaction()` for multi-statement writes (discussion+poll creation, reply+updatedAt bump). Follow that split: use transactions when a write spans multiple tables.

**API routes (`app/api/`):**
- `auth/register`, `auth/[...nextauth]` 鈥?registration + NextAuth handler.
- `discussions` (list/create), `discussions/[id]` (detail/delete), `discussions/[id]/replies`, `discussions/[id]/poll/vote` 鈥?forum CRUD.
- `uploads` + `uploads/[filename]` 鈥?image upload to `data/uploads/` on disk, auth-gated, image-mime-only, random UUID filename.
- `users/[username]` 鈥?public profile lookup.
- Forum APIs return shapes that mirror a Prisma-style nested structure (`author.minecraftId`, `_count.replies`) 鈥?the frontend components depend on this shape.

**Docker / deployment:**
- `Dockerfile` copies the **prebuilt** `.next/standalone` and `.next/static` (built locally via `npm run build`) 鈥?it does **not** run `npm ci` or `next build` inside the image. The prebuilt `.next` is committed to git for this reason (commit `518e47d`).
- `entrypoint.sh` runs `node scripts/migrate-db.js` then `node server.js` as the non-root `nextjs` user.
- The DB lives at `/app/data/dev.db` **inside the container** 鈥?`docker-compose.yml` mounts no volume, so recreating the container loses data. Back up with `docker cp infcraft-web-app:/app/data ./backup` before recreating. `data/uploads/` (user-uploaded images) has the same ephemeral caveat.
- For low-performance VPS, build the image locally, `docker save` to a tar, transfer, `docker load`, then `docker compose up -d --no-build`. See README 搂浣庢€ц兘 VPS 閮ㄧ讲.

## Conventions

- UI text and error messages are in **Chinese (zh-CN)** 鈥?match the existing language when adding user-facing strings.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Path alias `@/*` maps to repo root (tsconfig `paths`). Imports use `@/lib/...`, `@/components/...`, `@/config/...`.
