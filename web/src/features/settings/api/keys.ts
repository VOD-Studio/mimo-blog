/**
 * 站点设置 Query Keys
 */
export const settingsKeys = {
  all: ["settings"] as const,
  public: () => [...settingsKeys.all, "public"] as const,
};
