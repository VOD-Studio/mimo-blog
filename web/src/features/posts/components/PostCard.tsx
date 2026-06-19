import { Link } from "@tanstack/react-router";
import { Calendar, Eye } from "lucide-react";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

import type { PostSummary } from "../types";

interface PostCardProps {
  /** 文章摘要 */
  post: PostSummary;
  /** 是否跨两列 */
  featured?: boolean;
}

/**
 * Bento 风格文章卡片
 */
export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <BentoCard className="group p-0" colSpan={featured ? 2 : 1}>
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="flex h-full flex-col">
        {post.cover_image ? (
          <div className={cn("overflow-hidden", featured ? "aspect-[2/1]" : "aspect-video")}>
            <img
              src={post.cover_image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className={cn(
              "bg-gradient-to-br from-muted to-muted/50",
              featured ? "aspect-[2/1]" : "aspect-video",
            )}
          />
        )}

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-semibold leading-tight group-hover:text-primary">
            {post.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {post.published_at ? formatDate(post.published_at) : "未发布"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {post.view_count} 阅读
            </span>
          </div>

          <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, featured ? 6 : 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
    </BentoCard>
  );
}
