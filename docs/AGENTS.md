<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-09 | Updated: 2026-05-09 -->

# 文档目录 (docs/)

## 目录概述
docs/ 目录用于存储项目的文档资料，包含项目规划、说明文档和技术规范等内容。

## 文件结构
```
docs/
├── AGENTS.md              # 本文档 - AI 代理工作指令
└── plans/                 # 项目规划子目录
```

## 主要组件

### plans/ 子目录
- **用途**: 存储项目规划和开发计划
- **特点**: 专门用于集中管理项目的各类规划文档

## AI 代理工作指令

### 文档管理代理 (Document Agent)
- **职责**: 负责文档的创建、维护和更新
- **工作内容**:
  - 维护项目的各类文档
  - 确保文档的完整性和准确性
  - 按照统一格式编写文档

### 规划管理代理 (Planning Agent)  
- **职责**: 负责项目规划的制定和管理
- **工作内容**:
  - 制定项目开发计划
  - 跟踪项目进度
  - 更新规划文档

### 技术文档代理 (Technical Writer)
- **职责**: 编写和维护技术文档
- **工作内容**:
  - 编写 API 文档
  - 创建部署指南
  - 更新技术规范

## 工作流程
1. 文档创建 → 格式检查 → 内容审查 → 定期更新
2. 规划制定 → 进度跟踪 → 调整优化 → 成果归档

## 注意事项
- 所有文档必须使用统一的格式和命名规范
- 定期检查文档的时效性
- 重要文档需要版本控制

## TanStack Start 3.0 初始化记录

### CLI 命令

```bash
npx @tanstack/cli@latest create my-tanstack-app --framework React --non-interactive --yes --package-manager pnpm --no-git --intent --target-dir /tmp/tanstack-scaffold/my-tanstack-app
```

### 选项

- Stack: React
- Starter: blank（默认）
- Toolchain: 默认 CLI 工具链（Biome 由项目手动配置）
- Preset: Nova / base / neutral

### 关键依赖

- `@tanstack/react-start` — SSR 框架
- `@tanstack/react-router` — 类型安全路由
- `@tanstack/react-query` — 服务端状态
- `zustand` — 客户端状态
- `next-themes` — 主题
- `sonner` — Toast
- `tailwindcss` v4 + `shadcn/ui` — 样式与组件
- `biome` — 格式与 Lint
- `vitest` — 测试

### 环境变量

- `VITE_API_URL`: 后端 API 地址，必填
- `VITE_SERVER_ORIGIN`: SSR 时服务端 origin，可选
- `VITE_SITE_URL`: 站点公开 URL，可选
- `VITE_GITHUB_TOKEN`: GitHub 集成令牌，可选
- `VITE_ENABLE_ANALYTICS`: 是否启用分析，可选

### 部署说明

- 生产构建: `pnpm build`
- 生产启动: `pnpm start`（TanStack Start 默认）
- 使用 Node server preset（由 TanStack Start 默认配置）

### 关键架构决策

- 使用 TanStack Router 文件路由（`src/routes/`）
- SSR 首屏渲染，浏览器专属组件后续通过 lazy + Suspense 引入
- TanStack Query 管理服务端状态
- Zustand 管理客户端全局状态，使用 persist 中间件持久化到 localStorage
- 单文件单组件，建议不超过 400 行
- 禁止原生 confirm/alert/prompt

### 已知注意事项

- 不要直接使用 `import.meta.env`，统一通过 `src/lib/env.ts` 校验
- `src/styles.css` 包含 Tailwind v4 与 shadcn 主题变量，被 Biome 排除检查
- `src/routeTree.gen.ts` 自动生成，被 Biome 排除检查
- Zustand persist 配置 `skipHydration: true`，避免 SSR hydration 不匹配