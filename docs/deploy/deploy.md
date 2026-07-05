# 部署指南

记录手动部署 2.0（API + SSR Web）到 `your-domain.com` 的完整流程。该流程独立于 CI（`release-runbook.md` 描述的 rua + GitHub Actions 路径），适用于 runner 不可用或需要紧急手动发布的场景。

## 服务器环境

| 项 | 值 |
|---|---|
| 主机 | `your-domain.com`（root 登录，SSH 已配免密） |
| 架构 | `linux/amd64`（x86_64） |
| 容器运行时 | `podman` + `podman-compose`（**非 docker**） |
| 默认 shell | `fish`（脚本一律用 `bash -lc '...'` 显式调用） |
| 前置反代 | `nginx-proxy` + `letsencrypt-companion` 容器，监听 80/443 |
| 部署目录 | `/root/docker/mimo-blog`（含 `api/.env`、`secrets/`、`docker-compose.prod.yml`） |
| 构建目录 | `/root/build/mimo-blog`（临时，源码 + podman build，构建完可删） |

### 架构概览

```
Internet ──► nginx-proxy (80/443, TLS)
                │
                ├─ VIRTUAL_HOST=your-domain.com ──► blog-web:3000 (SSR)
                │   （通过 nginx-proxy 自动生成的 server block）
                │
                └─ /api/ （vhost.d/your-domain.com 手动配置）──► blog-api:9090

blog-web ──SSR 回源──► blog-api:9090 (via blog_network, VITE_SSR_API_BASE_URL)
blog-api ──► blog-postgres:5432, blog-redis:6379 (via blog_network)
```

`nginx-proxy` 通过 docker-gen 监听容器事件，根据容器的 `VIRTUAL_HOST` / `VIRTUAL_PORT` 环境变量自动生成 `/etc/nginx/conf.d/default.conf`。`/api/` 反代规则在 `/etc/nginx/vhost.d/your-domain.com`（手动维护，nginx-proxy 不会覆盖）。

## 前置条件

1. 本地能 `ssh your-domain.com echo ok`（免密）。
2. 本地装了 `rsync`。
3. 服务器 `/root/docker/mimo-blog` 已就绪：含 `api/.env`、`secrets/jwt_private_key.pem`、`secrets/jwt_public_key.pem`。这些是敏感凭据，**部署过程绝不覆盖**。**全新服务器首次部署见下方「首次部署：从零准备」章节，按那几步把这些建出来。**
4. `nginx-proxy` + `letsencrypt-companion` 容器在跑（负责 TLS 证书与反代）。这是**外部依赖**，本指南不展开其搭建——参考 [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) 与 [docker-letsencrypt-nginx-proxy-companion](https://github.com/nginx-proxy/docker-letsencrypt-nginx-proxy-companion) 项目文档。

## 首次部署：从零准备

> **何时需要**：拿到一台全新服务器，或 `/root/docker/mimo-blog` 还不存在。已有环境（含 `.env`、`secrets/`）的迭代部署**跳过本节**，直接进入「完整部署流程」。

部署完成后，服务器上应有这个目录结构：

```
/root/docker/mimo-blog/
├── api/
│   └── .env                  # 环境变量（敏感，不进 git）
├── secrets/
│   ├── jwt_private_key.pem   # JWT ES256 私钥
│   └── jwt_public_key.pem    # JWT ES256 公钥
└── docker-compose.prod.yml   # 第 3 步上传
```

### 第 0.1 步：创建目录

```bash
ssh your-domain.com "mkdir -p /root/docker/mimo-blog/api /root/docker/mimo-blog/secrets"
```

### 第 0.2 步：生成 JWT 密钥对

API 用 **ES256** 算法签发 JWT，必须用 `prime256v1` 椭圆曲线生成密钥对。容器以非 root 用户 `appuser`(UID 65532) 运行，密钥必须 chown 给它，否则容器内读不到、API 启动失败。

```bash
ssh your-domain.com "bash -lc '
cd /root/docker/mimo-blog/secrets && \
openssl ecparam -genkey -name prime256v1 -noout -out jwt_private_key.pem && \
openssl ec -in jwt_private_key.pem -pubout -out jwt_public_key.pem && \
chmod 600 jwt_private_key.pem && \
chmod 644 jwt_public_key.pem && \
chown 65532:65532 jwt_private_key.pem jwt_public_key.pem && \
ls -la
'"
```

验证：两个文件属主应为 `65532 65532`，私钥权限 `-rw-------`、公钥 `-rw-r--r--`。

> **不要把密钥提交到 git**。它们只在服务器 `secrets/` 目录，compose 以只读挂载（`:ro`）注入容器。

### 第 0.3 步：准备 `api/.env`

从仓库的 `api/.env.example` 拷贝到服务器，再编辑必填项：

```bash
# 本地执行：先把 .env.example 传到服务器
scp api/.env.example your-domain.com:/root/docker/mimo-blog/api/.env

# 然后登服务器编辑（或本地编辑后再 scp 覆盖）
ssh your-domain.com "vi /root/docker/mimo-blog/api/.env"
```

**必填项（其余有默认值，按需取消注释）：**

| 变量 | 说明 |
|---|---|
| `POSTGRES_PASSWORD` | 数据库密码，**必须**设强密码（`.env.example` 里是注释状态无默认值）。同时是 postgres 容器的初始化密码。 |
| `SUPERADMIN_ENABLED=true` | 首次部署**必须**开启，否则数据库里没有任何管理员账号，无法登录后台。 |
| `SUPERADMIN_USERNAME` | 超级管理员用户名 |
| `SUPERADMIN_EMAIL` | 超级管理员邮箱 |
| `SUPERADMIN_PASSWORD` | 超级管理员初始密码（首次启动后可改，见第 0.5 步） |

**可选项**（按需）：`GOOGLE_CLIENT_ID`、`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`、`RESEND_API_KEY`/`EMAIL_FROM`、`BILIBILI_SESSDATA`/`BILIBILI_BILI_JCT`/`BILIBILI_DEDEUSERID`。完整字段说明见 `api/.env.example` 注释。

**会被 compose 覆盖的项**（`.env` 里写本地值即可，生产时被 `docker-compose.prod.yml` 的 `environment:` 覆盖）：
- `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USER` / `DATABASE_PASSWORD` → compose 覆盖为内部服务名 `postgres`
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` → compose 覆盖为内部服务名 `redis`
- `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` → compose 覆盖为 `/secrets/*.pem`

### 第 0.4 步：数据库迁移（自动）

**无需手动操作。** API 容器启动时，`cmd/server/main.go` 会自动调用 `migrate.RunMigrations`（基于 golang-migrate）：

- 首次启动时 postgres 卷为空 → API 首次启动会建全部表
- 后续启动会自动应用新增的迁移文件（幂等）

如需手动操作（查版本、回滚）：

```bash
ssh your-domain.com "podman exec blog-api /migrate version"       # 当前版本
ssh your-domain.com "podman exec blog-api /migrate up"            # 应用所有待迁移
ssh your-domain.com "podman exec blog-api /migrate down -n 1"     # 回滚一次
```

> `/migrate` 二进制已打进 api 镜像（见 `api/Dockerfile`），无需在宿主机额外安装 migrate CLI。

### 第 0.5 步：超级管理员账号

第 0.3 步设了 `SUPERADMIN_ENABLED=true` 后，API **每次启动**都会检查：
- 若 enabled 且数据库里没有对应账号 → 创建
- 若已有账号 → 幂等跳过（不会改密码）

所以**首次启动后**就有一个可登录的管理员账号了。之后：
- 改密码：登录管理后台改，不要回过来改 env 里的 `SUPERADMIN_PASSWORD`（那是首次初始化用的，改了不会生效）
- `SUPERADMIN_PASSWORD` 这一项首次创建后可以从 `.env` 里删掉或留空，但**保持 `SUPERADMIN_ENABLED=true`**（关掉不会删除账号，但重启时会跳过超管检查逻辑）

---

准备完毕，进入下方「完整部署流程」。

## 完整部署流程

> 以下假设「首次部署：从零准备」已完成（全新服务器），或已有环境（迭代部署）。每一步都从本地执行，远程命令一律走 `ssh`。

### 第 1 步：同步源码到服务器构建目录

本地是 Apple Silicon（arm64），`buildx` 跨架构构建（amd64 via QEMU）在本机几乎不可用（卡死）。因此**在服务器原生 amd64 构建**。

```bash
# 在项目根执行
rsync -az --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='uploads' \
  --exclude='tmp' \
  --exclude='bin' \
  --exclude='dist' \
  --exclude='.tanstack' \
  --exclude='.omc' \
  api web your-domain.com:/root/build/mimo-blog/
```

排除 `node_modules` / `uploads`（可达数百 MB），服务器上 podman build 会重新装依赖。

### 第 2 步：服务器上构建镜像

用 `nohup` + 日志文件构建，避免 SSH 超时断开杀掉进程。**必须用 `bash -lc`**（服务器默认 fish）。

```bash
# 构建 API 镜像
ssh your-domain.com "bash -lc 'cd /root/build/mimo-blog && \
  rm -f /tmp/build-api.log && \
  nohup bash -c \"podman build -t localhost/mimo-blog-api:latest -f api/Dockerfile api > /tmp/build-api.log 2>&1; echo BUILD_API_EXIT=\$? >> /tmp/build-api.log\" >/dev/null 2>&1 & disown'"

# 构建 Web 镜像
ssh your-domain.com "bash -lc 'cd /root/build/mimo-blog && \
  rm -f /tmp/build-web.log && \
  nohup bash -c \"podman build -t localhost/mimo-blog-web:latest -f web/Dockerfile web > /tmp/build-web.log 2>&1; echo BUILD_WEB_EXIT=\$? >> /tmp/build-web.log\" >/dev/null 2>&1 & disown'"
```

轮询日志直到 `BUILD_*_EXIT=0`：

```bash
ssh your-domain.com "grep BUILD_API_EXIT /tmp/build-api.log; tail -3 /tmp/build-api.log"
ssh your-domain.com "grep BUILD_WEB_EXIT /tmp/build-web.log; tail -3 /tmp/build-web.log"
```

构建要点：
- `api/Dockerfile` 已设 `GOPROXY=https://goproxy.cn,direct`，国内服务器下载 Go modules 不超时。
- `web/Dockerfile` 多阶段：deps（pnpm install）→ builder（vite build + prune 生产依赖）→ runtime。
- `web/server.mjs` 是 SSR 启动器（详见下方「关键设计」），runtime 入口为 `node server.mjs`。

### 第 3 步：准备部署用 compose 文件

服务器 `/root/docker/mimo-blog` 没有 `api/`、`web/` 源码（只有 `api/.env` 和 `secrets/`），所以 compose 必须用 `image:` 引用已构建的镜像，**不能用 `build:`**。

生成 `/root/docker/mimo-blog/docker-compose.prod.yml`（关键片段）：

```yaml
services:
  # postgres / redis: 同本地 docker-compose.prod.yml，省略

  api:
    image: localhost/mimo-blog-api:latest   # ← 用 image，不是 build
    container_name: blog-api
    expose: ["9090"]                         # ← 2.0 端口是 9090（旧版 8080）
    env_file: [./api/.env]
    environment:
      DATABASE_HOST: postgres
      # ...其余同本地
    volumes:
      - uploads_data:/app/uploads
      - ./secrets/jwt_private_key.pem:/secrets/jwt_private_key.pem:ro
      - ./secrets/jwt_public_key.pem:/secrets/jwt_public_key.pem:ro
    healthcheck:
      # ← 必须用 GET，/api/health 不接受 HEAD（旧版用 HEAD 返回 405 导致一直 unhealthy）
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--method=GET", "-O-", "http://localhost:9090/api/health"]
    networks: [backend, proxy]               # ← 必须同时在 proxy 网络，nginx-proxy 才能转发

  web:
    image: localhost/mimo-blog-web:latest
    container_name: blog-web
    expose: ["3000"]                         # ← 不用 ports，避免和 nginx-proxy 抢 80
    environment:
      VIRTUAL_HOST: your-domain.com
      VIRTUAL_PORT: "3000"                   # ← 告诉 nginx-proxy 转发到 3000
      LETSENCRYPT_HOST: your-domain.com
      LETSENCRYPT_EMAIL: your-email@example.com
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3000/"]
    networks: [backend, proxy]
```

完整文件见仓库 `docker-compose.prod.yml`（构建参数版）—— 部署时把 `build:` 段整体替换为 `image:`。

### 第 4 步：备份旧 compose 并上传新的

```bash
# 备份（回滚用）
ssh your-domain.com "cp /root/docker/mimo-blog/docker-compose.prod.yml \
  /root/docker/mimo-blog/docker-compose.prod.yml.bak-$(date +%Y%m%d-%H%M%S)"

# 上传（本地把 image 版 compose 放到 /tmp 再 scp）
scp /tmp/deploy-compose.yml your-domain.com:/root/docker/mimo-blog/docker-compose.prod.yml
```

### 第 5 步：重启服务（保留 secrets / 数据卷）

```bash
ssh your-domain.com "bash -lc 'cd /root/docker/mimo-blog && \
  podman-compose --env-file api/.env -f docker-compose.prod.yml down && \
  podman-compose --env-file api/.env -f docker-compose.prod.yml up -d'"
```

`down` 只删容器，命名卷 `blog_postgres_data` / `blog_redis_data` / `blog_uploads_data` 保留，数据不丢。

**重要**：如果只改了 web，重建 web 容器即可（避免 API 短暂中断）。但 `podman-compose up -d web` 若容器已存在会**复用旧容器**，必须先 `podman rm -f blog-web`：

```bash
ssh your-domain.com "bash -lc 'cd /root/docker/mimo-blog && \
  podman rm -f blog-web && \
  podman-compose --env-file api/.env -f docker-compose.prod.yml up -d web'"
```

### 第 6 步：确认 nginx 反代

`nginx-proxy` 会根据 `blog-web` 的 `VIRTUAL_HOST` 自动生成 `your-domain.com` 的 server block。但 **`/api/` 反代需要手动维护** `/etc/nginx/vhost.d/your-domain.com`（在 nginx-proxy 容器内）：

```bash
ssh your-domain.com "podman exec nginx-proxy cat /etc/nginx/vhost.d/your-domain.com"
```

内容应为（**端口必须是 9090**）：

```nginx
# 允许大请求体：分片上传默认 chunk 5MB（前端最大 32MB），nginx 默认仅 1MB 会 413
client_max_body_size 64m;

# Proxy /api/** to backend API container
location ^~ /api/ {
    proxy_pass http://blog-api:9090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Proxy /uploads/** to API image service (GET /uploads/* 支持动态 resize/缩略图/webp 转码)
location ^~ /uploads/ {
    proxy_pass http://blog-api:9090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

`client_max_body_size 64m` 必须放在 server 级别（location 块之外）才会对该 vhost 所有请求生效。nginx 默认请求体上限仅 **1MB**，而分片上传的 chunk 默认 **5MB**（前后端一致），不配会直接 413。64MB 给前端 `MAX_CHUNK_SIZE`(32MB) 留 2× 余量。

`/uploads/` 必须反代到 API：图片服务挂在根路由 `GET /uploads/*`（不在 `/api/v1` 下），无参数直传原文件，带 `?w=&thumb=&format=` 时由 API 做动态转码（resize/缩略图/webp）。漏配会导致上传/头像文件 404（请求落到 blog-web 容器，那里没有这些文件）。

若端口是旧的 8080，改并 reload：

```bash
ssh your-domain.com "bash -lc '\
  podman exec nginx-proxy sed -i s/blog-api:8080/blog-api:9090/g /etc/nginx/vhost.d/your-domain.com && \
  podman exec nginx-proxy nginx -t && \
  podman exec nginx-proxy nginx -s reload'"
```

若 `blog-api` 不在 `nginx-proxy` 网络（nginx-proxy 转发失败 502），手动接入：

```bash
ssh your-domain.com "podman network connect nginx-proxy blog-api"
```

（compose 里 `networks: [backend, proxy]` + `proxy: external: true` 应自动处理，但 podman-compose 偶发不接入时需手动。）

### 第 7 步：验证

```bash
# 容器状态（4 个都应 healthy）
ssh your-domain.com "podman ps --format '{{.Names}}\t{{.Status}}' | grep blog"

# 外部访问
curl -sk -o /dev/null -w "web:%{http_code}\n" https://your-domain.com/
curl -sk -o /dev/null -w "css:%{http_code}\n" https://your-domain.com/assets/styles-<hash>.css
curl -sk https://your-domain.com/api/v1/announcements   # 应返回 {"data":[...]}
curl -sk -o /dev/null -w "health:%{http_code}\n" https://your-domain.com/api/health
```

## 关键设计：为什么 web 需要 server.mjs

TanStack Start 1.168 的 `vite build` 产出 `dist/server/server.js`，它只导出 H3 风格的 `{ fetch }` handler，**不调用 `listen()` 监听端口**。直接 `node dist/server/server.js` 会加载完模块立即退出（exit 0）。

`web/server.mjs` 是一层薄的 `node:http` wrapper：
- 用 `node:http` 创建 HTTP server 监听 `PORT`（默认 3000）
- 每个请求转成 Web `Request` 交给 `dist/server/server.js` 的 `fetch`
- 同时服务 `dist/client/` 下的静态资源（带 hash 的永久缓存，其他 no-cache）
- 优雅处理 SIGTERM/SIGINT

这是 TanStack Start「ditching adapters」理念下的标准做法：框架不绑定 HTTP server，由部署方提供最薄的 node:http 桥接。

## 常见坑

### 1. 端口 80 冲突
web 容器若用 `ports: ["80:3000"]`，会和 `nginx-proxy`（已占 80）冲突，启动报 `bind: address already in use`。**web 只能用 `expose: ["3000"]`**，让 nginx-proxy 转发。

### 2. healthcheck 用 HEAD 导致 API 一直 unhealthy
`/api/health` 路由只注册了 GET。旧 compose 用 `wget --spider`（发 HEAD）返回 405，API 永远 unhealthy，web 因 `depends_on: api healthy` 起不来。**healthcheck 必须显式 `--method=GET`**。

### 3. blog-api 不在 nginx-proxy 网络
若 `nginx-proxy` 转发 `/api/` 报 502，检查 `blog-api` 是否同时在 `blog_network` 和 `nginx-proxy` 两个网络。podman-compose 的 external 网络偶尔不自动接入，用 `podman network connect nginx-proxy blog-api` 手动补。

### 4. podman-compose 重建容器：三个坑都要避

**坑 A：`up -d <service>` 不重建已存在容器。** 改了镜像后若容器已存在，podman-compose 会复用旧容器（跑旧镜像）。

**坑 B：`up -d <service> --force-recreate` 会重建整个 stack。** podman-compose（与 docker-compose 行为不同）对 `--force-recreate` 的处理过于激进——即便指定了单个 service，它也会连带重建所有依赖容器，并在尝试删除 `blog_network` 时报 `network is being used`，留下半重建状态（实测：本只想重建 api，结果 web 卡在 Created、postgres/redis 被连带重启）。

**坑 C：`podman rm -f blog-api` 单独删会失败。** compose 里 `blog-web` 用 `depends_on: api healthy` 依赖 `blog-api`，podman 不允许删除「还被其他容器依赖」的容器，报 `has dependent containers which must be removed before it`。**api 和 web 是 depends_on 绑定的，必须成对处理**，且删除顺序是先删依赖者（web）再删被依赖者（api）。

**正确姿势——api/web 成对重建（改了 api 的镜像或 env 时）：**
```bash
ssh your-domain.com "cd /root/docker/mimo-blog && \
  podman rm -f blog-web && \
  podman rm -f blog-api && \
  podman-compose --env-file api/.env -f docker-compose.prod.yml up -d api web"
```
关键点：
1. **先删 `blog-web`，再删 `blog-api`**——顺序反了 api 删不掉（坑 C）。
2. **`up -d api web` 成对起**——只起 api 不起 web，web 会一直缺失直到下次手动起。
3. **不带 `--force-recreate`**（坑 B），用 `rm -f` 显式控制要删的容器。
4. postgres/redis 不受影响（没有被删，也不会被连带重启）。

只改了 web（镜像或 `.env.production`）时，web 没有被依赖，可以直接 `podman rm -f blog-web && up -d web`。

验证新配置已注入容器（env 是容器启动时注入的，不是运行时热加载）：
```bash
ssh your-domain.com "podman exec blog-api env | grep <变量名>"
```

### 5. SSH 连接中断
服务器构建慢（pnpm install + vite build 约 1-2 分钟），SSH 超时会杀进程。**一律用 `nohup ... & disown` + 日志文件**，然后轮询日志。

### 6. 上传报 500「创建分片目录失败」
`POST /api/v1/uploads` 返回 `INTERNAL_ERROR` / `创建分片目录失败`，根因是 `blog_uploads_data` 命名卷内 `/app/uploads` 属主为 root，而容器以非 root 用户 `appuser`(65532) 运行，`os.MkdirAll(/app/uploads/tmp/...)` 拿不到写权限。

命名卷首次挂载时为空，podman 从镜像 `/app` 层复制属主——若镜像里该目录是 root，卷内就是 root。

**排查：**
```bash
ssh your-domain.com "podman exec blog-api ls -la /app/uploads"
# 若属主是 root 即命中此问题
```

**热修复（不改镜像，立即解封）：**
```bash
ssh your-domain.com "podman exec -u 0 blog-api chown -R 65532:65532 /app/uploads"
```

**根治：** 镜像构建时预创建并 chown uploads 目录（已在 `api/Dockerfile` 的 runtime 阶段加 `RUN mkdir -p /app/uploads && chown -R 65532:65532 /app/uploads`），重建镜像后新部署不再复发。已存在的卷需用上面的热修复命令一次性纠正。

### 7. 上传/头像文件 404 但磁盘上存在
`GET /uploads/avatar/...`（或任何 `/uploads/` 路径）返回 404，但 `podman exec blog-api ls /app/uploads/...` 能看到文件、API 直连 `localhost:9090` 也能 200。根因是 nginx-proxy 的 `vhost.d/your-domain.com` 漏了 `/uploads/` location，请求落到了 `blog-web` 容器（那里没有这些文件）。

**排查：**
```bash
# vhost.d 是否有 /uploads/ 规则
ssh your-domain.com "podman exec nginx-proxy grep uploads /etc/nginx/vhost.d/your-domain.com"
# API 直连能 200 即说明是反代问题
ssh your-domain.com "podman exec blog-api wget -qO- 'http://localhost:9090/uploads/<path>' | head -c 4 | od -c"
```

**修复：** 在 `vhost.d/your-domain.com` 补 `location ^~ /uploads/ { proxy_pass http://blog-api:9090; ... }`（见第 6 步期望内容），`nginx -t && nginx -s reload`。注意 `/uploads/` 必须反代到 API 而非当静态文件，因为带 `?w=&thumb=&format=` 时要由 API 做动态转码。

### 8. 分片上传 413 Content Too Large
`PUT /api/v1/uploads/{id}/chunks/{index}` 返回 413，根因是 nginx 默认请求体上限仅 **1MB**，而分片 chunk 默认 **5MB**（前后端一致，前端最大 32MB）。请求在到达 API 前就被 nginx 拒掉。

**排查：**
```bash
# client_max_body_size 为空 → 用默认 1MB
ssh your-domain.com "podman exec nginx-proxy grep client_max_body_size /etc/nginx/vhost.d/your-domain.com"
```

**修复：** 在 `vhost.d/your-domain.com` 顶部（location 块之外，server 级别）加 `client_max_body_size 64m;`（见第 6 步期望内容），`nginx -t && nginx -s reload`。64MB 给前端最大 chunk 32MB 留 2× 余量。

## 回滚

### 镜像级回滚（podman 保留了旧镜像层）
```bash
# 查看历史镜像
ssh your-domain.com "podman images localhost/mimo-blog-api"
# 旧镜像若还在，retag 后重启
ssh your-domain.com "bash -lc 'podman tag <旧image-id> localhost/mimo-blog-api:latest && \
  cd /root/docker/mimo-blog && podman-compose --env-file api/.env -f docker-compose.prod.yml up -d --force-recreate api'"
```

### compose 回滚
```bash
ssh your-domain.com "cp /root/docker/mimo-blog/docker-compose.prod.yml.bak-YYYYMMDD-HHMMSS \
  /root/docker/mimo-blog/docker-compose.prod.yml && \
  cd /root/docker/mimo-blog && podman-compose --env-file api/.env -f docker-compose.prod.yml up -d --force-recreate"
```

### 数据库回滚
若新版本含破坏性迁移，回滚前在服务器手动降版本 schema：
```bash
ssh your-domain.com "podman exec blog-api /migrate version"       # 查看当前版本
ssh your-domain.com "podman exec blog-api /migrate down -n 1"     # 回滚一次迁移
```

## 临时占位容器（web 故障时保住 API）

web 容器跑不起来时，nginx-proxy 不会生成 `your-domain.com` 的 server block（没有健康容器可转发），导致**整个站（含 API）502**。这时起一个占位容器顶住 nginx 配置：

```bash
ssh your-domain.com "podman run -d --name blog-web-placeholder --network nginx-proxy \
  -e VIRTUAL_HOST=your-domain.com -e VIRTUAL_PORT=80 \
  -e LETSENCRYPT_HOST=your-domain.com -e LETSENCRYPT_EMAIL=your-email@example.com \
  docker.io/library/nginx:alpine"
```

placeholder 让 nginx-proxy 生成 your-domain.com 配置，`/api/` 反代照常工作（vhost.d 规则不依赖 web）。web 修好后 `podman rm -f blog-web-placeholder` 再起真 blog-web。

## 清理

```bash
# 删除构建目录（镜像已 tag，源码不再需要）
ssh your-domain.com "rm -rf /root/build/mimo-blog"

# 删除旧 image tar 包（若用 rsync + 服务器构建，不再有 images.tar.gz）
ssh your-domain.com "rm -f /root/docker/mimo-blog/images.tar.gz /root/docker/mimo-blog/*.tar.gz"

# podman 清理未使用的镜像层（释放空间）
ssh your-domain.com "podman image prune -f"
```
