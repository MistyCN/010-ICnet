# InfCraft Web

InfCraft / 无限大陆 Minecraft Java 服务器官网。项目包含服务器状态展示、轻量讨论区、公共设施清单、图片上传、注册登录，以及 OP 管理后台。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- NextAuth v4
- SQLite + Drizzle ORM + better-sqlite3
- minecraft-server-util
- Docker standalone 部署

## 本地开发

```bash
npm install
npm run db:migrate
npm run dev
```

本地开发读取 `.env.local`。不要把 `.env.local` 提交到 Git。

## 环境变量

本地开发复制 `.env.example` 为 `.env.local` 后按需修改。

生产服务器复制 `.env.production.example` 为 `.env`，并填入真实值。`docker-compose.yml` 会从服务器本地 `.env` 读取敏感配置，所以生产密钥不会进入 Git。

重要变量：

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SERVER_IP` | 玩家看到并复制的 Minecraft 地址 |
| `NEXT_PUBLIC_SERVER_PORT` | 玩家看到并复制的 Minecraft 端口 |
| `MC_STATUS_TIMEOUT_MS` | 服务器状态查询超时，单位毫秒 |
| `MC_STATUS_CACHE_TTL_SECONDS` | 状态查询成功缓存时间，单位秒 |
| `DATABASE_URL` | SQLite 数据库路径 |
| `NEXTAUTH_URL` | 生产站点公网 URL |
| `NEXTAUTH_SECRET` | NextAuth 密钥，生产必须使用强随机值 |
| `GLOBAL_ADMIN_PASSWORD` | `/admin` 初始化管理员密码，只用于授予注册用户 OP |

状态查询不再使用单独的后端地址配置。展示给玩家的地址是什么，状态 API 就以这个地址为入口查询。如果端口是 `25565`，API 会解析该域名的 Minecraft SRV 记录，并按 Minecraft 客户端的连接方式查询真实目标。

## 管理后台

访问 `/admin`。

第一次管理时使用 `GLOBAL_ADMIN_PASSWORD`，把一个已注册用户设为 OP。之后使用该用户自己的账号登录即可管理站点，不需要继续使用全局管理员密码。

当前 OP 权限：

- 查看用户列表
- 设置或取消用户 OP
- 删除任意讨论和回复
- 管理公共设施记录

## 数据库

本地默认使用 `dev.db`，该文件被 `.gitignore` 忽略。

迁移命令：

```bash
npm run db:migrate
```

当前迁移脚本是 `scripts/migrate-db.js`，Drizzle schema 在 `lib/db.ts`，改表结构时需要保持两边同步。

## 生产部署策略

本项目用于低性能云服务器时，推荐把源码和 Linux 生产构建产物一起提交到 Git。服务器只执行 `git pull` 和 Docker 镜像重建，不在服务器上执行 `npm install`、`npm run build` 或编译 `better-sqlite3`。

当前 `Dockerfile` 只复制仓库里的 `.next/standalone` 和 `.next/static`，不会在镜像内执行 Next 构建。因此提交前必须先在本地更新 `.next` 生产产物。

如果本地开发机是 Windows，而生产容器是 Linux，不要直接提交 Windows 主机上 `npm run build` 生成的 `.next`。请打开 Docker Desktop，并用 Linux 容器生成 `.next` 产物。

## 本地生成 Linux 生产产物

```powershell
docker build -f Dockerfile.artifact -t infcraft-web-artifact .
$cid = docker create infcraft-web-artifact
Remove-Item -Recurse -Force .\.next
docker cp "${cid}:/app/.next" .\.next
docker rm $cid
```

确认产物存在：

```powershell
Test-Path .\.next\standalone
Test-Path .\.next\static
```

然后提交源码和构建产物：

```powershell
npx.cmd tsc --noEmit
git status --short
git add -A
git commit -m "feat: update production build"
git push
```

不要提交 `.env.local`、`dev.db`、`data/`、`infcraft-web.tar`、`.next/dev/`、`.next/_events_*.json`。

## 服务器首次部署

```bash
git clone <your-repo-url> infcraft-web
cd infcraft-web
cp .env.production.example .env
nano .env
```

务必修改：

```env
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=replace-with-a-long-random-secret
GLOBAL_ADMIN_PASSWORD=replace-with-a-strong-bootstrap-admin-password
```

启动：

```bash
docker compose up -d --build
```

这里的 `--build` 只是用 Dockerfile 复制仓库里已经提交的 `.next` 产物，不会运行 `npm install` 或 `npm run build`。

## 服务器后续更新

更新前建议备份容器内数据：

```bash
docker cp infcraft-web-app:/app/data ./infcraft-data-backup-$(date +%Y%m%d-%H%M%S)
```

拉取并重建容器镜像：

```bash
cd infcraft-web
git pull
docker compose up -d --build
```

如果只改了服务器本地 `.env`，不需要 `git pull`，直接重启即可：

```bash
docker compose restart web
```

## 生产数据注意事项

当前 `docker-compose.yml` 没有挂载 `/app/data` 到宿主机，SQLite 数据库会保存在容器内部的 `/app/data/dev.db`。删除容器、强制重建容器或替换容器前，必须先备份数据。

备份：

```bash
docker cp infcraft-web-app:/app/data ./infcraft-data-backup
```

恢复：

```bash
docker cp ./infcraft-data-backup/. infcraft-web-app:/app/data/
docker restart infcraft-web-app
```

## 提交前检查

```bash
npx.cmd tsc --noEmit
docker compose config
git status --short
```

如果要让服务器通过 `git pull` 直接获得可部署版本，请确认 `.next/standalone` 和 `.next/static` 已经由 Linux Docker 环境生成并一起提交。
