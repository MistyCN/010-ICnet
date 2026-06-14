# 低性能 VPS 部署：本地构建镜像后上传

如果 VPS 性能较弱，不建议在服务器上执行 `npm ci`、`next build` 或编译 `better-sqlite3`。推荐在本地性能较好的机器上完成 Docker 镜像构建，再把镜像包上传到 VPS。这样服务器只负责加载镜像和运行容器。

## 当前数据策略：不使用挂载卷

当前 `docker-compose.yml` 不再挂载 `/app/data`，SQLite 数据库会写入容器内部的 `/app/data/dev.db`。

这能避开 1Panel/宿主机挂载目录权限导致的 `SQLITE_CANTOPEN` 问题，但有一个明确代价：如果删除容器、重新创建容器或使用新镜像强制替换容器，容器内部数据库会丢失。需要保留数据时，请先备份：

```bash
docker cp infcraft-web-app:/app/data ./infcraft-data-backup
```

恢复到新容器：

```bash
docker cp ./infcraft-data-backup/. infcraft-web-app:/app/data/
docker restart infcraft-web-app
```

## Git 上传前的本地构建产物

每次提交并上传 Git 前，先在本地执行：

```powershell
npm run build
```

确认预构建产物存在：

```powershell
Test-Path .\.next\standalone
Test-Path .\.next\static
```

两条命令都返回 `True` 后，再提交源码和 `.next` 构建产物：

```powershell
git add -A
git commit -m "your commit message"
git push
```

当前 Dockerfile 会直接复制 `.next/standalone` 和 `.next/static`，服务器执行 `docker compose up --build` 时不会再运行 `npm ci` 或 `npm run build`。

## 1. 本地构建生产镜像

在项目根目录执行：

```powershell
docker compose build
```

确认镜像已经生成：

```powershell
docker images infcraft-web
```

## 2. 导出镜像包

```powershell
docker save infcraft-web:latest -o infcraft-web.tar
```

`infcraft-web.tar` 是完整 Docker 镜像包，可以直接传到服务器。该文件已被 `.gitignore` 排除，不要提交到 Git 仓库。

## 3. 上传到 VPS

上传镜像包：

```powershell
scp .\infcraft-web.tar user@your-vps:/tmp/infcraft-web.tar
```

如果服务器上还没有部署目录，可以创建目录并上传 compose 文件：

```powershell
ssh user@your-vps "mkdir -p ~/infcraft-web"
scp .\docker-compose.yml user@your-vps:~/infcraft-web/docker-compose.yml
```

把 `user@your-vps` 替换成真实 SSH 用户名和服务器地址。

## 4. VPS 加载镜像

登录服务器：

```bash
ssh user@your-vps
```

加载镜像：

```bash
docker load -i /tmp/infcraft-web.tar
```

确认镜像存在：

```bash
docker images infcraft-web
```

## 5. VPS 启动容器

进入部署目录：

```bash
cd ~/infcraft-web
```

因为镜像已经在本地构建完成，服务器上不要再次 build：

```bash
docker compose up -d --no-build
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f
```

默认访问地址：

```text
http://服务器IP:3000
```

## 6. 后续更新流程

本地每次改完代码后：

```powershell
docker compose build
docker save infcraft-web:latest -o infcraft-web.tar
scp .\infcraft-web.tar user@your-vps:/tmp/infcraft-web.tar
```

VPS 上执行：

```bash
docker load -i /tmp/infcraft-web.tar
cd ~/infcraft-web
docker compose up -d --no-build --force-recreate
```

## 7. 可选：服务器使用精简 compose 文件

当前 `docker-compose.yml` 保留了 `build:`，方便本地开发和本地构建。低性能 VPS 上可以使用一个精简版 `docker-compose.prod.yml`，只引用已经加载好的镜像，不包含 `build:`。

示例：

```yaml
services:
  web:
    image: infcraft-web:latest
    container_name: infcraft-web-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SERVER_IP=infcraft.mistycn.com
      - NEXT_PUBLIC_SERVER_PORT=25565
      - MC_SERVER_HOST=s10-2.yxsjmc.cn
      - MC_SERVER_PORT=20065
      - MC_STATUS_TIMEOUT_MS=8000
      - MC_STATUS_CACHE_TTL_SECONDS=30
      - DATABASE_URL=file:/app/data/dev.db
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=replace-with-a-secure-secret-for-production-use
```

启动精简 compose：

```bash
docker compose -f docker-compose.prod.yml up -d
```

生产环境请务必修改：

- `NEXTAUTH_SECRET`：改成强随机字符串。
- `NEXTAUTH_URL`：改成实际域名，例如 `https://example.com`。
- `NEXT_PUBLIC_SERVER_IP` / `MC_SERVER_HOST`：按真实 Minecraft 服务器地址调整。

---
# InfCraft Web - Minecraft 服务器官网

**InfCraft Web** 是专为 Minecraft 游戏服务器「**InfCraft / 无限大陆**」设计的官网第一版项目。
该项目采用现代、轻量、深色系的设计风格，自带轻微的 Minecraft 方块感，在保证视觉高级感的同时实现真实的 Minecraft Java 版服务器状态查询。

---

## 📖 目录

- [技术栈](#-技术栈)
- [本地快速启动](#-本地快速启动)
- [环境变量配置](#-环境变量配置)
- [Docker 容器部署](#-docker-容器部署)
- [服务器状态查询说明](#-服务器状态查询说明)
- [服务器状态查询失败排查步骤](#-服务器状态查询失败排查步骤)
- [文案与公告维护规范](#-文案与公告维护规范)
- [轻量讨论与身份系统](#-轻量讨论与身份系统)
- [Git 初始化与提交规范](#-git-初始化与提交规范)
- [后续功能扩展建议](#-后续功能扩展建议)

---

## 🛠 技术栈

- **前端框架**：Next.js App Router (React 19, TypeScript)
- **样式方案**：Tailwind CSS (v4)
- **图标库**：lucide-react
- **状态查询**：`minecraft-server-util` (基于 TCP 的 Java Edition Server Ping 协议)
- **容器化支持**：Docker & Docker Compose (Standalone 模式构建，体积小，运行速度快)

---

## 🚀 本地快速启动

在本地运行或构建本项目前，请确保您已安装 [Node.js (v18+)](https://nodejs.org/)。

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```
启动后可在浏览器中访问 [http://localhost:3000](http://localhost:3000) 进行预览。

### 3. 本地构建与性能校验
```bash
npm run build
npm run start
```

---

## ⚙️ 环境变量配置

项目支持以下环境变量，可通过在项目根目录创建 `.env.local` 文件进行覆盖。

参考 `.env.example` 进行配置：

| 变量名 | 说明 | 默认值 | 示例值 |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SERVER_IP` | 网页前端展示的服务器 IP 地址 / 域名 | `your-server.example.com` | `play.infcraft.net` |
| `NEXT_PUBLIC_SERVER_PORT` | 网页前端展示的服务器端口 | `25565` | `25565` |
| `MC_SERVER_HOST` | 服务端 API 进行真实查询的目标 IP/域名 | 同 `NEXT_PUBLIC_SERVER_IP` | `192.168.1.100` |
| `MC_SERVER_PORT` | 服务端 API 进行真实查询的目标端口 | 同 `NEXT_PUBLIC_SERVER_PORT` | `25565` |
| `MC_STATUS_TIMEOUT_MS` | 服务端状态查询的 TCP 超时时间 (毫秒) | `3000` | `5000` |
| `MC_STATUS_CACHE_TTL_SECONDS` | 查询状态内存缓存的生存时间 (秒) | `30` | `60` |

> 📌 **注**：在本地开发或容器化部署时，如果将 `MC_SERVER_HOST` 指向局域网 IP（例如 `10.0.0.x` 或宿主机内网 IP），网页端依旧能通过公网的 `NEXT_PUBLIC_SERVER_IP` 指引玩家。

---

## 🐳 Docker 容器部署

项目已适配 Next.js Standalone 编译，在构建 Docker 镜像时会自动排除无关依赖，从而将镜像大小压缩到最小。

### 1. 使用 Docker Compose 一键启动
在生产环境下，可以通过如下命令编译并后台运行容器：
```bash
docker compose up -d --build
```

### 2. 验证容器状态
运行后可执行以下命令查看日志：
```bash
docker compose logs -f
```
访问宿主机的 `http://localhost:3000` 即可加载官网。

> ⚠️ **关于多实例集群部署的说明**：
> 默认的服务器状态缓存是基于 Node.js 服务端模块级变量的**内存缓存**（不需要外部 Redis）。如果您将其进行多实例集群部署，在多实例负载均衡下，实例间的缓存是独立的。如果实例数量极多，建议在此基础上引入 Redis，或延长缓存 TTL 减缓对 Minecraft 服务器的 Ping 压力。

---

## 🔍 服务器状态查询说明

- **接口地址**：`/api/server-status`
- **运行环境**：Node.js Runtime (`export const runtime = "nodejs"`, `export const dynamic = "force-dynamic"`)
- **实现文件**：[lib/minecraft/status.ts](file:///c:/Users/ZhuanZ1/Desktop/010%20ICnet/lib/minecraft/status.ts)
- **缓存策略**：默认 30 秒内存缓存。如果在 30 秒内有重复访问，会直接返回上一次查询成功的真实结果（或查询失败的安全兜底结果），避免多次访问导致对 Minecraft 服务器高频发起 TCP 连接。

---

## 🛠 服务器状态查询失败排查步骤

当状态卡片显示“服务器暂时离线”或 `/api/server-status` 返回 `online: false` 时，请按以下步骤逐一排查：

1. **Minecraft 服务端是否在线**：
   - 检查 Minecraft Java 服务端程序是否正常开启，并尝试在游戏客户端中直接连接，验证是否能够正常登入。
2. **域名解析问题**：
   - 检查配置文件或环境变量中的域名是否填写正确。如果是在本地搭建，请确认为 `localhost` 或对应内网 IP。
3. **端口正确性**：
   - Minecraft Java 版默认端口为 `25565`。如果修改过端口，请在配置中同步修改。
4. **防火墙与安全组**：
   - 确认 Minecraft 服务端所在的机器防火墙已放行该 TCP 端口。
   - 确认云服务器的虚拟网络安全组已开通此端口。
5. **Docker 网络隔离**：
   - 如果 Next.js 官网和 Minecraft 服务端部署在**同一台宿主机**的 Docker 容器中，容器之间默认可能无法通过外部公网 IP/域名互通。请尝试将 `MC_SERVER_HOST` 配置为宿主机的桥接 IP（如 `172.17.0.1`）或让容器加入同一个 Docker bridge 网络。
6. **基岩版 (Bedrock) 不兼容说明**：
   - 当前的查询实现基于 **Minecraft Java Edition** 的 Ping 协议，无法直接查询 Bedrock (基岩版) 或 Pocket Edition 服务器。

---

## 📝 文案与公告维护规范

为体现服务器的诚实度与专业态度，本站严格遵循**“非营销、不伪造、克制展现”**的规范：

1. **禁止捏造事实**：
   - 禁止在页面中硬编码或编造“运营多年”、“万人在线”、“超大型社区”、“完美经济”等不实词汇。
2. **玩法说明管理**：
   - 玩法规则的定义和描述应当集中在 [config/site.ts](file:///c:/Users/ZhuanZ1/Desktop/010%20ICnet/config/site.ts) 的 `features` 数组中。
   - 暂未确定的玩法需要写为 `"TODO: 填写生存玩法说明"`，前端会自动识别并渲染成灰色的“待补充”占位卡片，不会引发页面报错。
3. **公告维护**：
   - 所有静态公告存放在 [content/news.ts](file:///c:/Users/ZhuanZ1/Desktop/010%20ICnet/content/news.ts) 中。
   - 如果当前没有待发布的公告，请保持 `newsList` 导出的数组为空 `[]`，页面会自动渲染为优雅的“暂无公告”状态，严禁为了填充页面而编造假公告。
4. **社交链接配置**：
   - 官方 QQ 群、Discord、KOOK、B站等链接均统一在 `config/site.ts` 的 `socialLinks` 中管理。
   - 如果某个群聊暂未创建或不愿展示，请将该字段值设置为 `null` 或留空，前端将自动显示为“待补充”。

---

## 🌿 Git 初始化与提交规范

### 1. 仓库初始化
若您拿到的是全新代码，可进行以下命令初始化 Git 仓库：
```bash
git init
git add .
git commit -m "feat: init InfCraft Web official site first version"
```

### 2. 推荐提交规范 (Conventional Commits)
日常开发与功能迭代，推荐采用如下前缀规范进行 Commit 提交：
- `feat:` 新增功能（如添加排行榜页、用户登录等）
- `fix:` 修复缺陷（如修复移动端折叠导航错位）
- `docs:` 仅文档更改（如修改 `README.md`）
- `style:` 代码格式调整（不影响业务逻辑，如格式化、删空行）
- `refactor:` 代码重构（不增加新功能，也不修复 Bug）
- `chore:` 构建过程或辅助工具变动（如修改 `.gitignore`，修改依赖等）

---

## 💬 轻量讨论与身份系统

本项目实现了一个基于 **Minecraft ID** 登录的轻量讨论区系统。

### 1. 核心设计原则
* **无需邮箱**：为保护隐私和极简化登入，用户注册仅需要填写 **Minecraft 游戏 ID** 和密码，不支持且不收集任何邮箱。
* **身份隔离**：系统不进行 Mojang/Microsoft 官方账号的所有权验证（即离线模式注册），仅通过服务器本地数据库进行 ID 唯一性及密码匹配。
* **回帖与刷新**：支持发起讨论和回复，点击刷新按钮会立即更新列表/回复，发表新回复会自动更新讨论的活跃度排序。
* **防重复提交**：所有表单与操作按钮在提交时会自动展示加载状态，并禁用二次点击。

### 2. 数据库迁移与初始化
项目使用 SQLite 作为本地持久化数据库（`dev.db`）。
* **更新客户端类型**（修改 Schema 后）：
  ```bash
  npm run db:generate
  ```
* **本地执行数据库迁移**：
  ```bash
  npm run db:migrate
  ```
* **打开 Prisma 数据库可视化面板**：
  ```bash
  npm run db:studio
  ```

### 3. 数据备份与容器持久化
当前 Docker 部署不使用挂载卷，数据库文件保存在容器内部的 `/app/data/dev.db`。
* **手动备份数据库**：
  删除或重建容器前，请先从容器内复制数据库文件，例如：
  ```bash
  docker cp infcraft-web-app:/app/data/dev.db ./backup-dev.db
  ```

---

## 🔮 后续功能扩展建议

官网架构搭建清晰且模块化，非常方便您在后续迭代中扩展以下功能：

1. **外部数据库集成**：
   - 可以在后端 API 中集成 Prisma 或 Drizzle ORM，连接 PostgreSQL/MySQL，用于实现用户注册、白名单申请数据落库。
2. **赞助系统与商店**：
   - 扩展 `/donate` 路由，接入支付 SDK（如支付宝/微信或海外 Stripe），展示赞助档位。
3. **排行榜系统**：
   - 编写 API 从 Minecraft 游戏服务器的插件数据库（例如 LuckPerms, Vault, CoreProtect 等数据库）中实时读取玩家金币榜、杀怪榜，并呈现在前端。
4. **在线地图 (Dynmap / BlueMap)**：
   - 新建 `/map` 页面，利用 `<iframe>` 或 Leaflet.js 接入您的 Dynmap/BlueMap 实时渲染三维地图。
5. **服务器百科 (Wiki)**：
   - 可在 `app/wiki` 中基于 Markdown 或集成 MDX 快速打造服务器玩法 Wiki 百科全书。
