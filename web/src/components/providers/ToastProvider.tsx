"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

interface ToastProviderProps {
  /** 子元素 */
  children: ReactNode;
}

/**
 * 全局 Toast Provider
 */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
