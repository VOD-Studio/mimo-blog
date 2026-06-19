/**
 * 歌曲 DTO
 */
export interface Song {
  /** 歌曲名 */
  name: string;
  /** 艺术家 */
  artist: string;
  /** 音频 URL */
  url: string;
  /** 封面 */
  cover?: string;
}

/**
 * 歌单 DTO
 */
export interface Playlist {
  /** 歌单 ID */
  id: string;
  /** 标题 */
  title: string;
  /** 封面 */
  cover?: string;
  /** 创建者 */
  creator?: string;
  /** 平台 */
  platform: string;
  /** 第三方歌单 ID */
  playlist_id: string;
  /** 歌曲数量 */
  song_count: number;
  /** 歌曲列表 */
  songs: Song[];
  /** 是否启用 */
  is_active: boolean;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 播放器设置
 */
export interface MusicSettings {
  /** 播放器版本 */
  player_version: string;
}
