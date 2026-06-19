/**
 * 项目信息
 */
export interface Project {
  /** 项目 ID */
  id: string;
  /** 项目名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 封面图 */
  cover?: string;
  /** 项目链接 */
  url?: string;
  /** GitHub 链接 */
  githubUrl?: string;
  /** 标签 */
  tags: string[];
}
