/**
 * 项目 DTO
 */
export interface Project {
  /** 项目 ID */
  id: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 项目链接 */
  url?: string;
  /** GitHub 链接 */
  github_url?: string;
  /** 封面图 URL */
  image_url?: string;
  /** 技术栈 */
  tech_stack: string[];
  /** 排序 */
  sort_order: number;
  /** 创建时间 */
  created_at: string;
}
