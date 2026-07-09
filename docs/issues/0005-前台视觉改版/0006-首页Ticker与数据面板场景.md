# Issue-0006：首页 Ticker + 图像数据面板场景

## Parent

PRD：`../../prd/0004-前台视觉改版.md`

## What to build

在 Hero 场景之后新增两个滚动场景：**Ticker 跑马灯**（站点标语 / 最新文章标题轮播的滚动文字带）和**图像数据面板**（滚动触发的文章卡片面板，展示真实最新文章）。Ticker 作为场景间过场节拍，数据面板用真实内容驱动而非装饰。

## Acceptance criteria

- [ ] 新增 `TickerScene` 组件：水平无限滚动的文字带（站点标语 + 最新文章标题轮播），用 Maple Mono 等宽字体
- [ ] Ticker 在视口内才滚动（可用 IntersectionObserver 暂停离屏滚动，省性能），`prefers-reduced-motion` 时静止
- [ ] 新增 `DataPanelScene` 组件：滚动入场时（fade/translate）展示最新文章卡片，内容来自 `fetchPosts`（复用 React Query 预取数据），不写死装饰图
- [ ] 数据面板的文章卡片复用或适配现有 `PostCard`，保持三套主题下视觉一致
- [ ] 改 `routes/index.tsx`：在 HeroScene 之后接入 TickerScene + DataPanelScene，替换原"最新文章"分区
- [ ] SSR：数据面板内容 SSR 预取（loader 已有 post 预取），滚动动画客户端水合后激活
- [ ] `make web-typecheck && make web-lint` 全绿

## Blocked by

Issue-0005（首页 Hero 场景）—— 复用首页场景化骨架，且 Ticker 紧接 Hero。

## 实现指引

- Ticker 无限滚动用纯 CSS `@keyframes` translateX 即可（一条文字带复制两份无缝循环），无需 JS 库。
- 数据面板的滚动入场可用 Framer Motion 的 `whileInView` 或原生 IntersectionObserver + CSS transition。若本 issue 已决定引入 Framer Motion（为 Issue-0007 叙事铺路），在此处先行引入。
- Ticker 文字内容：站点标语可来自 settings，文章标题来自 posts 数据。
