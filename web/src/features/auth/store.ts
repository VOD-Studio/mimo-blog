"use client";

import { create } from "zustand";

/**
 * 认证状态占位 store
 *
 * Task 6 将扩展为完整的 Zustand + persist 实现。
 */
export const useAuthStore = create<{
  /** 初始化认证状态 */
  initialize: () => void;
}>(() => ({
  initialize: () => {
    // 占位实现
  },
}));
