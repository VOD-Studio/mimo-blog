/**
 * 音乐模块 Query Keys
 */
export const musicKeys = {
  all: ["music"] as const,
  playlists: () => [...musicKeys.all, "playlists"] as const,
  activePlaylists: () => [...musicKeys.playlists(), "active"] as const,
  settings: () => [...musicKeys.all, "settings"] as const,
};
