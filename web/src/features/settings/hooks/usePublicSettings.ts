import { useQuery } from "@tanstack/react-query";

import { settingsKeys } from "../api/keys";
import { fetchPublicSettings } from "../api/queries";

/**
 * 公开站点设置 Query
 */
export function usePublicSettings() {
  return useQuery({
    queryKey: settingsKeys.public(),
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });
}
