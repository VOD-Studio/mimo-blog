import { Link } from "@tanstack/react-router";
import { Calendar, Eye } from "lucide-react";

import { TiltCard } from "@/components/reactbits/TiltCard";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

import type { PostSummary } from "../types";

interface PostCardProps {
  /** 文章摘要 */
  post: PostSummary;
}

/**
 * 文章卡片
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <TiltCard tiltAmount={8}>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-brand/50 hover:shadow-md">
        {post.cover_image ? (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-muted to-muted/50" />
        )}

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-semibold leading-tight">
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="hover:text-brand focus:outline-none"
            >
              {post.title}
            </Link>
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {post.published_at ? formatDate(post.published_at) : "未发布"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {post.view_count} 次阅读
            </span>
          </div>

          <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </TiltCard>
  );
}
