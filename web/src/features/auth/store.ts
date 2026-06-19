"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthUser } from "./types";

/**
 * 判断当前是否在浏览器环境
 */
function isClient() {
  return typeof window !== "undefined";
}

/**
 * 服务端占位 storage，避免 localStorage 访问报错
 */
const noopStorage: Storage = {
  length: 0,
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  key: () => null,
  clear: () => undefined,
};

/**
 * 认证状态
 */
interface AuthState {
  /** 当前用户 */
  user: AuthUser | null;
  /** 访问令牌 */
  accessToken: string | null;
  /** 刷新令牌 */
  refreshToken: string | null;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 设置认证信息 */
  setAuth: (auth: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  /** 设置 token（登录/刷新后） */
  setTokens: (auth: { accessToken: string; refreshToken: string }) => void;
  /** 清除认证 */
  clearAuth: () => void;
  /** 从持久化恢复 */
  initialize: () => void;
}

/**
 * 认证状态管理，使用 Zustand + persist
 *
 * SSR 注意事项：
 * - persist 中间件默认在客户端 hydration 后恢复状态
 * - skipHydration: true 避免 SSR hydration 不匹配
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isInitialized: false,
      setAuth: (auth) =>
        set({
          user: auth.user,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          isInitialized: true,
        }),
      setTokens: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          isInitialized: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isInitialized: true,
        }),
      initialize: () => set({ isInitialized: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => (isClient() ? localStorage : noopStorage)),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
