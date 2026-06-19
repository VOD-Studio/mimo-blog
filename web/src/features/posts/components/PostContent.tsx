import type { PostDetail } from "../types";

interface PostContentProps {
  /** 文章详情 */
  post: PostDetail;
}

/**
 * 文章正文渲染
 */
export function PostContent({ post }: PostContentProps) {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h1>{post.title}</h1>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: post content from trusted admin editor */}
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
