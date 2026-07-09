import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 769px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * useMediaQuery — SSR 安全的媒体查询 hook
 *
 * 首屏返回 false（与桌面/非降级态一致），避免水合不匹配；
 * 水合后按 matchMedia 实际值更新。
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onChange) => {
            const mql = window.matchMedia(query);
            mql.addEventListener("change", onChange);
            return () => mql.removeEventListener("change", onChange);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
}

/** 是否桌面端（>768px） */
export function useIsDesktop(): boolean {
    return useMediaQuery(DESKTOP_QUERY);
}

/** 是否启用减少动效 —— 降级用 */
export function usePrefersReducedMotion(): boolean {
    return useMediaQuery(REDUCED_MOTION_QUERY);
}
