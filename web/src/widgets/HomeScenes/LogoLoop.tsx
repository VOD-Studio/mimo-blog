import { useEffect, useRef } from "react";

export interface LogoLoopItem {
    /** 显示名 / 标签 */
    name: string;
    /** 跳转链接（可选，无则纯展示） */
    href?: string;
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
 * 内容复制一份做无缝循环，CSS animation 恒速滚动。
 * 左右淡出遮罩 + reduced-motion 时静止平铺。
 * skills 模式（iconOnly）渲染为纯圆形图标 pill。
 */
export default function LogoLoop({
    items,
    speed = 80,
    direction = "left",
    iconOnly = false,
}: LogoLoopProps) {
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const track = trackRef.current;
        if (!track || items.length === 0) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        // 恒速：按 speed(px/s) 算 duration，走完半条 track 回到起点
        const halfWidth = track.scrollWidth / 2;
        const duration = Math.max(halfWidth / speed, 6);
        track.style.animationDuration = `${duration}s`;
        track.style.animationDirection = direction === "right" ? "reverse" : "normal";
    }, [items.length, speed, direction]);

    if (items.length === 0) return null;

    // 复制一份做无缝循环
    const loop = [...items, ...items];

    return (
        <div className="logo-loop">
            <div className="logo-loop__viewport">
                <div
                    ref={trackRef}
                    className="logo-loop__track"
                    style={{ animation: "logo-loop-scroll 30s linear infinite" }}
                >
                    <ul className="logo-loop__sequence">
                        {loop.map((item, i) => {
                            const inner = iconOnly ? (
                                <span className="logo-loop__fallback">{item.name.slice(0, 1)}</span>
                            ) : (
                                <>
                                    <span className="logo-loop__fallback">
                                        {item.name.slice(0, 1)}
                                    </span>
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
