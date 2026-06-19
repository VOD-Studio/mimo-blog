import { useQuery } from "@tanstack/react-query";

import { musicKeys } from "../api/keys";
import { fetchActivePlaylists, fetchMusicSettings } from "../api/queries";

/**
 * 获取启用的歌单列表
 */
export function useActivePlaylists() {
  return useQuery({
    queryKey: musicKeys.activePlaylists(),
    queryFn: fetchActivePlaylists,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取音乐播放器设置
 */
export function useMusicSettings() {
  return useQuery({
    queryKey: musicKeys.settings(),
    queryFn: fetchMusicSettings,
    staleTime: 5 * 60 * 1000,
  });
}
