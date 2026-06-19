"use client";

import { Github } from "lucide-react";

import { cn } from "@/lib/utils";

import { GlassCard } from "./GlassCard";

interface GitHubContributionsProps {
  username?: string;
  className?: string;
}

/**
 * GitHub 贡献图展示
 *
 * 使用公开的 ghchart.rshig.com SVG 服务渲染贡献日历。
 */
export function GitHubContributions({ username, className }: GitHubContributionsProps) {
  const hasUsername = Boolean(username);
  const chartUrl = username ? `https://ghchart.rshig.com/${username}` : undefined;

  return (
    <GlassCard className={cn("w-full", className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Github className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">GitHub 贡献</h3>
          <p className="text-sm text-muted-foreground">
            {hasUsername ? `@${username}` : "未配置 GitHub 用户名"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex min-h-[120px] items-center justify-center overflow-hidden rounded-xl bg-muted/50">
        {chartUrl ? (
          <img
            src={chartUrl}
            alt={`${username} 的 GitHub 贡献图`}
            className="w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Github className="size-8 opacity-40" />
            <p>暂无贡献数据</p>
            <p>在后台配置 GitHub 用户名后即可展示贡献日历</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
