import { useAnnouncements } from "@features/settings/api/queries";
import { useEffect, useRef } from "react";

/**
 * TickerScene — 公告跑马灯
 *
 * 公告拼接成一条长文本，复制 8 份做无缝水平滚动。
 * 关键是恒速算法——JS 测量 track 宽度，按 100px/s 算 duration，
 * 保证内容多长肉眼速度恒定。reduced-motion/移动端静止。
 */
export default function TickerScene() {
    const { data: announcements } = useAnnouncements();
    const trackRef = useRef<HTMLDivElement>(null);

    const items = (announcements ?? [])
        .filter((a) => a.is_active !== false)
        .slice(0, 6)
        .map((a) => `[${a.severity?.toUpperCase() ?? "NOTE"}] ${a.title}`);

    useEffect(() => {
        const track = trackRef.current;
        if (!track || items.length === 0) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return;

        // 恒速：100px/s，duration = (trackWidth/2) / speed
        const trackWidth = track.scrollWidth;
        const distance = trackWidth / 2;
        const duration = distance / 100;
        track.style.animationDuration = `${Math.max(duration, 4)}s`;
    }, [items.length]);

    if (items.length === 0) return null;

    return (
        <section className="border-y border-border bg-background py-3.5" aria-label="公告跑马灯">
            <div className="overflow-hidden">
                <div
                    ref={trackRef}
                    className="ticker-marquee flex w-max items-center gap-8 font-mono text-sm font-medium tracking-wider text-muted-foreground"
                    style={{ animation: "ticker-scroll 30s linear infinite" }}
                >
                    {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} className="flex shrink-0 items-center gap-8">
                            <span className="text-foreground/80">{items[i % items.length]}</span>
                            <span aria-hidden className="text-primary">
                                ×
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
