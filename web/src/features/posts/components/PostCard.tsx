import { Link } from "@tanstack/react-router";
import { TiltCard } from "@/components/reactbits/TiltCard";
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
    <TiltCard>
      <Card className="h-full transition-colors hover:border-brand/50">
        <CardHeader>
          <CardTitle>
            <Link to="/blog/$slug" params={{ slug: post.slug }}>
              {post.title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {post.published_at ? formatDate(post.published_at) : "未发布"} · {post.view_count}{" "}
            次阅读
          </p>
          <p className="mt-2 line-clamp-3 text-muted-foreground">{post.excerpt}</p>
        </CardContent>
      </Card>
    </TiltCard>
  );
}
