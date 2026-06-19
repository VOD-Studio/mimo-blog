import { api } from "@/lib/api";

import type { MusicSettings, Playlist } from "../types";

/**
 * 获取启用的歌单列表
 */
export async function fetchActivePlaylists(): Promise<Playlist[]> {
  const response = await api.get("/api/v1/music/playlists/active");
  return response.data as Playlist[];
}

/**
 * 获取音乐播放器设置
 */
export async function fetchMusicSettings(): Promise<MusicSettings> {
  const response = await api.get("/api/v1/music/settings");
  return response.data as MusicSettings;
}
