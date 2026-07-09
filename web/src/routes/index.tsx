import { githubKeys } from "@features/github/api/keys";
import { fetchContributions, fetchRepos } from "@features/github/api/queries";
import { postKeys } from "@features/posts/api/keys";
import { fetchPosts } from "@features/posts/api/queries";
import { settingsKeys } from "@features/settings/api/keys";
import { fetchAnnouncements, fetchSettings } from "@features/settings/api/queries";
import { createFileRoute } from "@tanstack/react-router";
import { DataLayerScene, DisplayScene, HeroScene, TickerScene } from "@widgets/HomeScenes";

/**
 * 首页 — 滚动叙事
 *
 * 结构：取景器 Hero → 跑马灯 Ticker → 站点数据网格 → 展示层 pin 叙事。
 * 各场景自包含数据获取与动画，首页只负责组合与 SSR 预取。
 */
function HomePage() {
    return (
        <div className="home-page flex flex-col">
            <HeroScene />
            <TickerScene />
            <DataLayerScene />
            <DisplayScene />
        </div>
    );
}

export const Route = createFileRoute("/")({
    loader: async ({ context }) => {
        context.queryClient
            .ensureQueryData({ queryKey: settingsKeys.public(), queryFn: fetchSettings })
            .catch(() => {});
        context.queryClient
            .ensureQueryData({
                queryKey: postKeys.list({}),
                queryFn: () => fetchPosts({}),
            })
            .catch(() => {});
        context.queryClient
            .ensureQueryData({
                queryKey: settingsKeys.announcements(),
                queryFn: fetchAnnouncements,
            })
            .catch(() => {});
        context.queryClient
            .ensureQueryData({ queryKey: githubKeys.contributions(), queryFn: fetchContributions })
            .catch(() => {});
        context.queryClient
            .ensureQueryData({ queryKey: githubKeys.repos(), queryFn: fetchRepos })
            .catch(() => {});
    },
    component: HomePage,
});
