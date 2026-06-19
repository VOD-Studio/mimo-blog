"use client";

import type { ReactNode } from "react";

import { ShinyText } from "@/components/reactbits/ShinyText";

interface PageHeaderProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  description?: ReactNode;
  /** 额外操作区 */
  action?: ReactNode;
  /** 对齐方式（默认居中，保持各页面统一） */
  align?: "left" | "center";
  /** 是否添加底部间距 */
  className?: string;
}

/**
 * 统一页面标题区
 *
 * 为所有公开页面提供一致的标题、副标题与操作区布局，
 * 避免各页面标题大小、间距、动效不统一的问题。
 */
export function PageHeader({
  title,
  description,
  action,
  align = "center",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={`mb-10 md:mb-14 ${align === "center" ? "text-center" : ""} ${className ?? ""}`}
    >
      <div
        className={`flex flex-col gap-4 ${
          align === "center" ? "items-center" : "items-start"
        } sm:flex-row sm:items-end sm:justify-between`}
      >
        <div className={align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            <ShinyText>{title}</ShinyText>
          </h1>
          {description && (
            <p className="mt-3 text-base text-muted-foreground md:text-lg">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
