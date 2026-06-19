/**
 * 站点公开设置
 */
export interface SiteSettings {
  /** 站点名称 */
  site_name: string;
  /** 站点描述 */
  site_description: string;
  /** 站点 URL */
  site_url: string;
  /** 每页文章数 */
  posts_per_page: number;
  /** 是否启用评论 */
  comments_enabled: boolean;
  /** 评论是否需要审核 */
  comments_moderation: boolean;
  /** GitHub 用户名 */
  github_username?: string;
  /** 技术栈 */
  tech_stack?: string;
  /** 个人简介 */
  bio?: string;
  /** 页脚文本 */
  footer_text?: string;
}
