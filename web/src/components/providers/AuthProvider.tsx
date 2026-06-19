"use client";

import { type ReactNode, useEffect } from "react";

import { fetchMe } from "@/features/auth/api/mutations";
import { useAuthStore } from "@/features/auth/store";

interface AuthProviderProps {
  /** 子元素 */
  children: ReactNode;
}

/**
 * 初始化认证状态。
 *
 * 若本地存有 access token，则尝试调用 /auth/me 恢复用户信息；
 * 否则仅标记初始化完成。
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  useEffect(() => {
    async function restoreAuth() {
      if (!accessToken) {
        initialize();
        return;
      }

      try {
        const user = await fetchMe();
        setAuth({
          user,
          accessToken,
          refreshToken: refreshToken ?? "",
        });
      } catch {
        clearAuth();
      } finally {
        initialize();
      }
    }

    restoreAuth();
  }, [accessToken, refreshToken, initialize, setAuth, clearAuth]);

  return children;
}
