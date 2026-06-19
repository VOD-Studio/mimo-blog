"use client";

import { type ReactNode, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store";

interface AuthProviderProps {
  /** 子元素 */
  children: ReactNode;
}

/**
 * 初始化认证状态，Zustand persist 会自动从 localStorage 恢复。
 * 在 SSR 场景下，初始状态为空，hydration 完成后由 persist 中间件恢复。
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return children;
}
