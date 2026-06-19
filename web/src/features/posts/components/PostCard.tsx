import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>
          <Link to="/blog/$slug" params={{ slug: post.slug }}>
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {formatDate(post.publishedAt)} · {post.viewCount} 次阅读
        </p>
        <p className="mt-2 line-clamp-3 text-muted-foreground">{post.excerpt}</p>
      </CardContent>
    </Card>
  );
}
