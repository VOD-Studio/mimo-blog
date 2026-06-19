"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { RippleButton } from "@/components/reactbits/RippleButton";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** 图标 */
  icon: LucideIcon;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** 额外内容 */
  children?: ReactNode;
  /** 视觉变体 */
  variant?: "default" | "compact";
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用空状态组件
 *
 * 静态展示，避免再增加进场动画造成视觉疲劳。
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  variant = "default",
  className,
}: EmptyStateProps) {
  const content = (
    <>
      <div
        className={cn(
          "mx-auto flex items-center justify-center rounded-full bg-primary/10 text-primary",
          variant === "default" ? "h-16 w-16" : "h-12 w-12",
        )}
      >
        <Icon className={variant === "default" ? "size-8" : "size-6"} />
      </div>
      <h3
        className={cn(
          "mt-4 font-semibold tracking-tight",
          variant === "default" ? "text-xl" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <RippleButton
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </RippleButton>
      )}
      {children}
    </>
  );

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/30 p-8 text-center",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={cn("py-16 text-center md:py-24", className)}>
      <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-muted/70 p-8 shadow-sm backdrop-blur-sm dark:bg-card/70 md:p-12">
        {content}
      </div>
    </div>
  );
}
