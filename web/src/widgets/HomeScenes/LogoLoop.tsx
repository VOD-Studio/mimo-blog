import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as SimpleIcons from "simple-icons";

export interface LogoLoopItem {
    /** 显示名 / 标签 */
    name: string;
    /** 跳转链接（可选，无则纯展示） */
    href?: string;
    /** 自定义图标（可选，无则显示首字母） */
    icon?: React.ReactNode;
    /** simple-icons slug（可选，优先于 icon / 首字母） */
    iconSlug?: string;
}

interface LogoLoopProps {
    items: LogoLoopItem[];
    /** 滚动速度（px/s） */
    speed?: number;
    /** 方向，默认 left（向左滚） */
    direction?: "left" | "right";
    /** 仅展示图标尺寸的 pill（skills 用） */
    iconOnly?: boolean;
}

/**
 * LogoLoop — 无限横向滚动轨道（社交/技能用）
 *
 * 内容复制多份做无缝循环，CSS animation 恒速滚动。
 * JS 根据视口宽度动态计算所需份数，保证轨道始终比视口宽两倍以上，
 * 避免右侧出现空白断带。
 *
 * 交互：
 * - 桌面端鼠标悬停暂停
 * - 桌面端拖拽可手动滚动，释放后从当前位置继续自动滚动
 * reduced-motion 时静止平铺。
 */
export default function LogoLoop({
    items,
    speed = 80,
    direction = "left",
    iconOnly = false,
}: LogoLoopProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const sequenceRef = useRef<HTMLUListElement>(null);
    const [copies, setCopies] = useState(2);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef<{ x: number; translateX: number } | null>(null);

    const loop = useMemo(
        () => Array.from({ length: copies }).flatMap(() => items),
        [items, copies],
    );

    const finePointer = useMemo(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches,
        [],
    );

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        const sequence = sequenceRef.current;
        if (!viewport || !track || !sequence || items.length === 0) return;

        const adjust = () => {
            if (isDragging) return;

            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) return;

            // 移动端静态平铺时无需补全轨道长度，保持两份即可
            if (getComputedStyle(sequence).flexWrap === "wrap") {
                if (copies !== 2) setCopies(2);
                return;
            }

            const viewportWidth = viewport.clientWidth;
            const oneCopyWidth = track.scrollWidth / copies;
            if (oneCopyWidth <= 0) return;

            const needed = Math.max(2, Math.ceil((viewportWidth * 2) / oneCopyWidth));
            const evenNeeded = needed % 2 === 0 ? needed : needed + 1;
            if (evenNeeded !== copies) {
                setCopies(evenNeeded);
            }
        };

        adjust();
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(adjust);
        ro.observe(viewport);
        return () => ro.disconnect();
    }, [items.length, copies, isDragging]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: copies 改变轨道总宽度，需重新计算动画时长
    useLayoutEffect(() => {
        const track = trackRef.current;
        if (!track || items.length === 0 || isDragging) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        // 恒速：按 speed(px/s) 算 duration，走半条 track 回到起点
        const halfWidth = track.scrollWidth / 2;
        const duration = Math.max(halfWidth / speed, 6);
        track.style.animationDuration = `${duration}s`;
        track.style.animationDirection = direction === "right" ? "reverse" : "normal";
    }, [items.length, speed, direction, copies, isDragging]);

    // hover / 拖拽时暂停自动滚动
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        track.style.animationPlayState = isHovered || isDragging ? "paused" : "running";
    }, [isHovered, isDragging]);

    const handlePointerEnter = useCallback(() => {
        if (finePointer) setIsHovered(true);
    }, [finePointer]);

    const handlePointerLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!finePointer) return;
            const track = trackRef.current;
            if (!track) return;

            // 不拦截链接/按钮的点击与拖拽
            const target = e.target as HTMLElement;
            if (target.closest("a, button")) return;

            e.preventDefault();
            const translateX = getTranslateX(track);
            dragStart.current = { x: e.clientX, translateX };
            setIsDragging(true);
            track.style.transform = `translateX(${translateX}px)`;
            track.style.animationPlayState = "paused";
        },
        [finePointer],
    );

    // 拖拽中跟随鼠标
    useEffect(() => {
        if (!isDragging) return;
        const track = trackRef.current;
        if (!track || !dragStart.current) return;

        const start = dragStart.current;
        const handleMove = (e: PointerEvent) => {
            const deltaX = e.clientX - start.x;
            track.style.transform = `translateX(${start.translateX + deltaX}px)`;
        };

        const handleUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp, { once: true });
        return () => {
            window.removeEventListener("pointermove", handleMove);
        };
    }, [isDragging]);

    // 拖拽结束：用 animation-delay 让自动滚动从当前位置无缝续接
    useEffect(() => {
        if (isDragging) return;
        const track = trackRef.current;
        if (!track || !dragStart.current) return;

        const halfWidth = track.scrollWidth / 2;
        const currentTranslateX = getTranslateX(track);
        const offset = ((currentTranslateX % halfWidth) + halfWidth) % halfWidth;
        const elapsed = direction === "left" ? offset / speed : (halfWidth - offset) / speed;

        track.style.animationDelay = `${-elapsed}s`;
        track.style.transform = "";
        track.style.animationPlayState = isHovered ? "paused" : "running";
        dragStart.current = null;
    }, [isDragging, isHovered, speed, direction]);

    if (items.length === 0) return null;

    return (
        <div className="logo-loop">
            <div
                ref={viewportRef}
                className={`logo-loop__viewport${isDragging ? " is-dragging" : ""}`}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
            >
                <div
                    ref={trackRef}
                    className={`logo-loop__track${isHovered || isDragging ? " is-paused" : ""}`}
                    style={{ animation: "logo-loop-scroll 30s linear infinite" }}
                >
                    <ul ref={sequenceRef} className="logo-loop__sequence">
                        {loop.map((item, i) => {
                            const iconKey = item.iconSlug ? `si${item.iconSlug}` : undefined;
                            const simple = iconKey
                                ? (SimpleIcons as Record<string, { svg: string } | undefined>)[
                                      iconKey
                                  ]
                                : undefined;
                            const iconNode = simple ? (
                                <span
                                    className="logo-loop__icon logo-loop__icon--svg"
                                    // biome-ignore lint/security/noDangerouslySetInnerHtml: simple-icons 为静态本地 SVG 路径
                                    dangerouslySetInnerHTML={{ __html: simple.svg }}
                                />
                            ) : item.icon ? (
                                <span className="logo-loop__icon">{item.icon}</span>
                            ) : (
                                <span className="logo-loop__fallback">{item.name.slice(0, 1)}</span>
                            );
                            const inner = iconOnly ? (
                                iconNode
                            ) : (
                                <>
                                    {iconNode}
                                    <span className="logo-loop__label">{item.name}</span>
                                </>
                            );
                            const cls = `logo-loop__pill${iconOnly ? " logo-loop__pill--static" : ""}`;
                            return (
                                <li key={`${item.name}-${i}`} className="logo-loop__item">
                                    {item.href ? (
                                        <a
                                            href={item.href}
                                            className={cls}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {inner}
                                            {iconOnly ? (
                                                <span className="logo-loop__tooltip">
                                                    {item.name}
                                                </span>
                                            ) : null}
                                        </a>
                                    ) : (
                                        <span className={cls}>
                                            {inner}
                                            {iconOnly ? (
                                                <span className="logo-loop__tooltip">
                                                    {item.name}
                                                </span>
                                            ) : null}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
}

/** 读取元素当前 transform 的 translateX（px） */
function getTranslateX(element: HTMLElement): number {
    const transform = window.getComputedStyle(element).transform;
    if (transform === "none") return 0;
    return new DOMMatrixReadOnly(transform).m41;
}
