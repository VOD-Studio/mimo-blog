# Issue-0001：主题 token 系统（风格 × 明暗 二维解耦）

## Parent

PRD：`../../prd/0004-前台视觉改版.md`

## What to build

把前台主题从单一明暗（`.dark`）升级为**风格（palette）× 明暗**二维体系。在 `<html>` 上叠加风格类（`theme-genshin` / `theme-zzz` / `theme-neutral`），与 next-themes 的 `.dark` 正交。三套配色方案的 OKLCH token 落到 CSS，辉光/聚光等遗留变量改为派生自语义强调色。

这是整个改版的基础设施 tracer bullet——后续切换器、动效适配、首页叙事都依赖这套 token。

## Acceptance criteria

- [ ] `web/src/styles.css` 新增风格类 token 块：`:root.theme-genshin` / `:root.theme-zzz` / `:root.theme-neutral`，每个含亮色定义；对应的 `.dark` 组合（如 `:root.theme-genshin.dark`）含暗色定义
- [ ] 三套配色的 `--primary` / `--accent` / `--ring` 等 OKLCH 值按 PRD 基线实现，并用对比度工具校准正文 token（background/foreground）≥ 4.5:1
- [ ] 无风格类时兜底为中性（`:root` 默认即中性亮，与现有一致）
- [ ] `--glow-soft` 等遗留辉光变量改为派生自当前主题 `--primary`（而非硬编码 `220 90% 60%`），使 glow/SpotlightCard 随主题变色
- [ ] 风格选择持久化到 cookie（与 next-themes 明暗 cookie 并列），key 自定（如 `palette`）
- [ ] SSR 读取风格 cookie 防 FOUC：在根文档（`RootDocument` / `__root` shellComponent）的内联启动脚本里，SSR 前注入风格类，避免水合闪烁
- [ ] 手动验证：手动给 `<html>` 加各风格类组合（如 `theme-genshin dark`），页面配色正确变化，辉光跟随
- [ ] `make web-typecheck && make web-lint` 全绿

## Blocked by

无 —— 可立即开始。这是改版的入口切片。

## 实现指引

- next-themes 当前配置在 `web/src/shared/api/provider.tsx`（`attribute="class" defaultTheme="system"`），它只管 `.dark`。风格维度**不要**塞进 next-themes 的 `themes` 映射，而是独立用一个轻量存储（cookie 读写 + `<html>` class 操作），保持两个维度解耦。
- SSR 防闪烁参考 next-themes 注入 `.dark` 的方式：在 `RootDocument` 的 `<head>` 内联脚本里同步读 cookie 并 `document.documentElement.classList.add('theme-xxx')`。
- OKLCH 校准可用浏览器 DevTools 或在线 OKLCH 对比度工具；PRD 给的是方向基线，实现时以"三套主题下正文都清晰可读"为准。
- 风格类只覆盖配色 token，不改布局/间距/圆角。
