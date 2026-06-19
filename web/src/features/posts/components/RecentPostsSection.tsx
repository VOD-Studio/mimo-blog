import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

import { postKeys } from "../api/keys";
import { fetchPosts } from "../api/queries";

/**
 * 最近文章列表
 */
export function RecentPostsSection() {
  const { data, isLoading } = useQuery({
    queryKey: postKeys.list({ page: 1, limit: 6 }),
    queryFn: () => fetchPosts({ page: 1, limit: 6 }),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12">加载中...</div>;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-2xl font-bold">最近文章</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>
                <Link to="/blog/$slug" params={{ slug: post.slug }}>
                  {post.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{formatDate(post.publishedAt)}</p>
              <p className="mt-2 line-clamp-3 text-muted-foreground">{post.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
