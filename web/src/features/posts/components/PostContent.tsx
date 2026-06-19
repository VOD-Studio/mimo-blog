import { Calendar, Clock, Eye, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

import type { Post } from "../types";

interface PostContentProps {
  /** 文章详情 */
  post: Post;
}

/**
 * 文章正文渲染
 */
export function PostContent({ post }: PostContentProps) {
  const readingTime = Math.max(
    1,
    Math.ceil(post.content_html.replace(/<[^>]+>/g, "").length / 500),
  );

  return (
    <article>
      <header className="mb-8">
        {post.cover_image && (
          <div className="mb-8 aspect-[2.4/1] overflow-hidden rounded-3xl">
            <img
              src={post.cover_image}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-4" />
            {post.published_at ? formatDate(post.published_at) : "未发布"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-4" />
            {readingTime} 分钟阅读
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-4" />
            {post.view_count} 次阅读
          </span>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag className="mr-1 size-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="prose dark:prose-invert max-w-none">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: post content from trusted admin editor */}
        <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
      </div>
    </article>
  );
}
