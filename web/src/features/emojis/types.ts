/**
 * 表情 DTO
 */
export interface Emoji {
  /** 表情 ID */
  id: number;
  /** 分组 ID */
  group_id: number;
  /** 名称 */
  name: string;
  /** 图片 URL */
  url: string;
  /** 来源 URL */
  source_url?: string;
  /** GIF 版本 URL */
  gif_url?: string;
  /** 文本替代 */
  text_content?: string;
  /** 排序 */
  sort_order: number;
}

/**
 * 表情分组 DTO
 */
export interface EmojiGroup {
  /** 分组 ID */
  id: number;
  /** 分组名称 */
  name: string;
  /** 来源 */
  source: string;
  /** 排序 */
  sort_order: number;
  /** 是否启用 */
  is_enabled: boolean;
  /** 表情列表 */
  emojis: Emoji[];
}
