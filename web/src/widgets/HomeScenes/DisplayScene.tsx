import { useIsDesktop, usePrefersReducedMotion } from "@shared/lib/hooks/use-media-query";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

// ===== 展示层阶段时长（秒）=====
const PHASE1_DURATION = 1.2; // 垂直线延展
const PHASE2_DURATION = 1.0; // 柱子水平扩展
const PHASE2_TEXT_OFFSET = 0.5; // 柱子扩展到 50% 时文字滑入
const PHASE3_DURATION = 0.6; // 主标题渐入
const PHASE4_DURATION = 1.5; // hold
const PHASE5_DURATION = 0.4; // 文字消失
const PHASE6_DURATION = 1.0; // 柱子扩全屏
const DISPLAY_TOTAL =
    PHASE1_DURATION +
    PHASE2_DURATION +
    PHASE3_DURATION +
    PHASE4_DURATION +
    PHASE5_DURATION +
    PHASE6_DURATION;

// ===== 百叶窗阶段时长（秒）=====
const SHUTTER_PANEL_STEP = 0.5;
const SHUTTER_MERGE_DELAY = 0.22;
const SHUTTER_START_OFFSET = DISPLAY_TOTAL + 0.3;

// Interlude 内部时序
const INTERLUDE_FG_START = 0.1;
const INTERLUDE_FG_DURATION = 0.5;
const INTERLUDE_BG_START = 0.6;
const INTERLUDE_BG_DURATION = 0.4;
const INTERLUDE_STRIPS_START = 1.0;
const INTERLUDE_STRIPS_DURATION = 1.0;
const INTERLUDE_COPY_START = 1.5;
const INTERLUDE_COPY_DURATION = 0.4;
const INTERLUDE_TOTAL = 2.4;

// Merge 内部时序
const MERGE_FINAL_IMAGE_OFFSET = 0.02;
const MERGE_FINAL_IMAGE_DURATION = 1.2;
const MERGE_VIDEO_START = MERGE_FINAL_IMAGE_OFFSET + 0.5;
const MERGE_VIDEO_DURATION = 0.8;
const MERGE_MIDGROUND_REVEAL_END = MERGE_FINAL_IMAGE_OFFSET + MERGE_FINAL_IMAGE_DURATION;
const MERGE_FOREGROUND_DURATION = 1.0;
const MERGE_FINAL_COPY_GAP = 0.12;
const MERGE_FINAL_COPY_AT =
    MERGE_MIDGROUND_REVEAL_END + MERGE_FOREGROUND_DURATION + MERGE_FINAL_COPY_GAP;

const PILLAR_FINAL_WIDTH = "18vw";

// 百叶窗 5 张长条图
const SHUTTER_PANELS = [
    {
        title: "外部站点",
        english: "PROJECTS",
        description: "Mi主站 · 工具导航",
        image: "/home/shutter-1.webp",
        direction: "up",
    },
    {
        title: "术业专攻",
        english: "SPECIALITIES",
        description: "AI学习 · 技术架构 · 踩坑记录",
        image: "/home/shutter-2.webp",
        direction: "down",
    },
    {
        title: "博客特色",
        english: "BLOG FEATURES",
        description: "RAG 知识检索 · 归档热力图 · 结构化知识库",
        image: "/home/shutter-3.webp",
        direction: "up",
    },
    {
        title: "站点技术",
        english: "STACK",
        description: "Astro · SSG静态生成 · 纯AI零手工",
        image: "/home/shutter-4.webp",
        direction: "down",
    },
    {
        title: "相册收录",
        english: "PHOTO ALBUM",
        description: "AI 生图 · API 接入",
        image: "/home/shutter-5.webp",
        direction: "up",
    },
];

const DISPLAY_CONFIG = {
    kicker: "展示",
    title: "CRYSTALLIZE GALLERY",
    description:
        "Where fleeting visions crystallize into permanence — each frame a frozen breath of time, each work a memory hardened into light.",
};

const SHUTTER_CONFIG = {
    kicker: "The End",
    title: "愿你每一天 都闪闪发光",
    description: "岁岁常欢愉，万事皆胜意",
};

/**
 * DisplayScene — 首页滚动叙事核心（展示层 + 百叶窗）
 *
 * 一个 ScrollTrigger pin，scrub 驱动整段。DOM 结构、CSS class、GSAP 时间线一一对应。
 * 展示层：垂直线生长 → 柱子扩展 → 三栏文字 → 文字消失 → 柱子扩全屏。
 * 百叶窗：5 张长条图依次滑入 → interlude 三层插入 → 遮罩展开 + 最终三层图 merge。
 * 仅桌面端 + 非 reduced-motion 启用，其余降级为静态展示。
 */
export default function DisplayScene() {
    const rootRef = useRef<HTMLElement>(null);
    const isDesktop = useIsDesktop();
    const reduced = usePrefersReducedMotion();
    const enabled = isDesktop && !reduced;

    useEffect(() => {
        if (!enabled) return;
        const root = rootRef.current;
        if (!root) return;

        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
            const viewport = root.querySelector(".home-display-layer__viewport") as HTMLElement;
            const line = root.querySelector(".home-display-layer__line") as HTMLElement;
            const pillar = root.querySelector(".home-display-layer__pillar") as HTMLElement;
            const kicker = root.querySelector(".home-display-layer__kicker") as HTMLElement;
            const title = root.querySelector(".home-display-layer__title") as HTMLElement;
            const desc = root.querySelector(".home-display-layer__description") as HTMLElement;
            const finalVideo = root.querySelector(
                ".home-portfolio-shutter__final-video",
            ) as HTMLVideoElement;
            const finalMidground = root.querySelector(
                ".home-portfolio-shutter__final-image--midground",
            ) as HTMLElement;
            const finalForeground = root.querySelector(
                ".home-portfolio-shutter__final-image--foreground",
            ) as HTMLElement;
            const finalCopy = root.querySelector(
                ".home-portfolio-shutter__final-copy",
            ) as HTMLElement;
            const mask = root.querySelector(".home-portfolio-shutter__mask") as HTMLElement;
            const panels = gsap.utils.toArray<HTMLElement>(".home-portfolio-shutter__panel");
            const panelCopies = gsap.utils.toArray<HTMLElement>(
                ".home-portfolio-shutter__panel-copy",
            );
            const interlude = root.querySelector(
                ".home-portfolio-shutter__interlude",
            ) as HTMLElement;
            const interludeBg = root.querySelector(
                ".home-portfolio-shutter__interlude-bg",
            ) as HTMLElement;
            const interludeFg = root.querySelector(
                ".home-portfolio-shutter__interlude-fg",
            ) as HTMLElement;
            const interludeCopyLeft = root.querySelector(
                ".home-portfolio-shutter__interlude-copy-text--left",
            ) as HTMLElement;
            const interludeCopyRight = root.querySelector(
                ".home-portfolio-shutter__interlude-copy-text--right",
            ) as HTMLElement;
            const stripLeft = root.querySelector(
                ".home-portfolio-shutter__interlude-strip--left",
            ) as HTMLElement;
            const stripRight = root.querySelector(
                ".home-portfolio-shutter__interlude-strip--right",
            ) as HTMLElement;

            if (
                !viewport ||
                !line ||
                !pillar ||
                !kicker ||
                !title ||
                !desc ||
                !finalVideo ||
                !finalMidground ||
                !finalForeground ||
                !finalCopy ||
                !mask ||
                !interlude ||
                !interludeBg ||
                !interludeFg ||
                !interludeCopyLeft ||
                !interludeCopyRight ||
                !stripLeft ||
                !stripRight ||
                panels.length !== 5
            )
                return;

            // ===== 初始状态 =====
            gsap.set(line, { scaleY: 0, transformOrigin: "50% 100%" });
            gsap.set(pillar, { scaleX: 0, transformOrigin: "50% 50%" });
            gsap.set([kicker, title, desc], { autoAlpha: 0 });
            gsap.set(mask, { scaleY: 0, transformOrigin: "50% 100%" });
            gsap.set(finalMidground, { autoAlpha: 0, yPercent: -35, scale: 1.06 });
            gsap.set(finalVideo, { autoAlpha: 0 });
            gsap.set(finalForeground, { autoAlpha: 0, xPercent: -50, scale: 1.02 });
            gsap.set(finalCopy, { autoAlpha: 0, y: 80 });
            gsap.set(panelCopies, { autoAlpha: 0, y: 48 });
            panels.forEach((panel) => {
                const direction = panel.dataset.direction === "down" ? "down" : "up";
                const fromY = direction === "up" ? 150 : -150;
                gsap.set(panel, { autoAlpha: 0, yPercent: fromY });
                const image = panel.querySelector(
                    ".home-portfolio-shutter__panel-image",
                ) as HTMLElement;
                if (image) gsap.set(image, { yPercent: 0, scale: 1.02 });
            });
            gsap.set(interlude, { autoAlpha: 1 });
            gsap.set(interludeBg, { autoAlpha: 0 });
            gsap.set(interludeFg, { autoAlpha: 0, yPercent: 8, scale: 1.04 });
            gsap.set([interludeCopyLeft, interludeCopyRight], { autoAlpha: 0 });
            gsap.set(stripLeft, { xPercent: -100 });
            gsap.set(stripRight, { xPercent: 100 });

            // ===== 时间线 =====
            const tl = gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                    trigger: root,
                    start: "top top",
                    end: getPinEnd(),
                    pin: root,
                    pinSpacing: true,
                    scrub: true,
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                },
            });

            // ===== 展示层 =====
            tl.addLabel("display-phase1", 0);
            tl.to(
                line,
                { scaleY: 1, duration: PHASE1_DURATION, ease: "power3.inOut" },
                "display-phase1",
            );

            tl.addLabel("display-phase2", `display-phase1+=${PHASE1_DURATION}`);
            tl.to(line, { autoAlpha: 0, duration: 0.15, ease: "power2.in" }, "display-phase2");
            tl.to(
                pillar,
                { scaleX: 1, duration: PHASE2_DURATION, ease: "power3.inOut" },
                "display-phase2",
            );
            tl.fromTo(
                kicker,
                { autoAlpha: 0, xPercent: -30 },
                { autoAlpha: 1, xPercent: 0, duration: 0.5, ease: "power2.out" },
                `display-phase2+=${PHASE2_TEXT_OFFSET}`,
            );
            tl.fromTo(
                desc,
                { autoAlpha: 0, xPercent: 30 },
                { autoAlpha: 1, xPercent: 0, duration: 0.5, ease: "power2.out" },
                `display-phase2+=${PHASE2_TEXT_OFFSET}`,
            );

            tl.addLabel("display-phase3", `display-phase2+=${PHASE2_DURATION}`);
            tl.to(
                title,
                { autoAlpha: 1, duration: PHASE3_DURATION, ease: "power2.out" },
                "display-phase3",
            );

            tl.addLabel("display-phase4", `display-phase3+=${PHASE3_DURATION}`);
            tl.to({}, { duration: PHASE4_DURATION, ease: "none" }, "display-phase4");

            tl.addLabel("display-phase5", `display-phase4+=${PHASE4_DURATION}`);
            tl.to(
                [kicker, title, desc],
                { autoAlpha: 0, duration: PHASE5_DURATION, ease: "power2.inOut", stagger: 0.04 },
                "display-phase5",
            );

            tl.addLabel("display-phase6", `display-phase5+=${PHASE5_DURATION}`);
            const fullWidthScale = 100 / parseFloat(PILLAR_FINAL_WIDTH);
            tl.to(
                pillar,
                { scaleX: fullWidthScale, duration: PHASE6_DURATION, ease: "power3.inOut" },
                "display-phase6",
            );

            // ===== 百叶窗 =====
            const mergeBase = SHUTTER_START_OFFSET + getShutterMergeStart();
            tl.addLabel("shutter-panels", SHUTTER_START_OFFSET);
            panels.forEach((panel, index) => {
                const at = `shutter-panels+=${index * SHUTTER_PANEL_STEP}`;
                tl.to(panel, { autoAlpha: 1, yPercent: 0, duration: 0.48, ease: "power3.out" }, at);
                const image = panel.querySelector(".home-portfolio-shutter__panel-image");
                if (image)
                    tl.to(
                        image,
                        { yPercent: 0, scale: 1.02, duration: 0.58, ease: "power2.out" },
                        at,
                    );
                tl.to(
                    panelCopies[index],
                    { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" },
                    `shutter-panels+=${index * SHUTTER_PANEL_STEP + 0.3}`,
                );
            });

            tl.addLabel("shutter-interlude", mergeBase);
            tl.to(
                panelCopies,
                { autoAlpha: 0, y: -36, duration: 0.28, stagger: 0.02, ease: "power2.out" },
                "shutter-interlude",
            );
            tl.to(
                interludeFg,
                {
                    autoAlpha: 1,
                    yPercent: 0,
                    scale: 1,
                    duration: INTERLUDE_FG_DURATION,
                    ease: "power3.out",
                },
                `shutter-interlude+=${INTERLUDE_FG_START}`,
            );
            tl.to(
                interludeBg,
                { autoAlpha: 1, duration: INTERLUDE_BG_DURATION, ease: "power2.inOut" },
                `shutter-interlude+=${INTERLUDE_BG_START}`,
            );
            tl.to(
                stripLeft,
                { xPercent: 0, duration: INTERLUDE_STRIPS_DURATION, ease: "power3.inOut" },
                `shutter-interlude+=${INTERLUDE_STRIPS_START}`,
            );
            tl.to(
                stripRight,
                { xPercent: 0, duration: INTERLUDE_STRIPS_DURATION, ease: "power3.inOut" },
                `shutter-interlude+=${INTERLUDE_STRIPS_START}`,
            );
            tl.to(
                [interludeCopyLeft, interludeCopyRight],
                {
                    autoAlpha: 1,
                    duration: INTERLUDE_COPY_DURATION,
                    ease: "power2.out",
                    stagger: 0.08,
                },
                `shutter-interlude+=${INTERLUDE_COPY_START}`,
            );

            tl.addLabel("merge", `shutter-interlude+=${INTERLUDE_TOTAL}`);
            tl.to(mask, { scaleY: 1, duration: 0.9, ease: "power3.inOut" }, "merge");
            tl.to(
                finalMidground,
                {
                    autoAlpha: 1,
                    yPercent: 0,
                    scale: 1,
                    duration: MERGE_FINAL_IMAGE_DURATION,
                    ease: "power3.inOut",
                },
                `merge+=${MERGE_FINAL_IMAGE_OFFSET}`,
            );
            tl.to(
                finalVideo,
                {
                    autoAlpha: 1,
                    duration: MERGE_VIDEO_DURATION,
                    ease: "power2.inOut",
                    onStart: () => finalVideo.play().catch(() => undefined),
                },
                `merge+=${MERGE_VIDEO_START}`,
            );
            tl.to(
                finalForeground,
                {
                    autoAlpha: 1,
                    xPercent: -50,
                    scale: 1,
                    duration: MERGE_FOREGROUND_DURATION,
                    ease: "power2.inOut",
                },
                `merge+=${MERGE_MIDGROUND_REVEAL_END}`,
            );
            tl.to(
                finalCopy,
                { autoAlpha: 1, y: 0, duration: 0.46, ease: "power3.inOut" },
                `merge+=${MERGE_FINAL_COPY_AT.toFixed(2)}`,
            );
            tl.to({ hold: 0 }, { hold: 1, duration: 1.0, ease: "none" });
        }, rootRef);

        // 同步 title-bar 的 clip 路径：让 panel-copy::before 的灰度背景只覆盖 title-bar 区域，
        // 而非覆盖整张图。根据 title-bar 在 copy 内的偏移计算 inset 上下值。
        const syncClip = () => syncTitleBarClipPaths(root);
        syncClip();
        ScrollTrigger.refresh();

        const onResize = () => syncClip();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            ctx.revert();
        };
    }, [enabled]);

    if (!enabled) {
        return (
            <section className="container mx-auto px-6 py-32">
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
                    展示
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                    {DISPLAY_CONFIG.title}
                </h2>
                <p className="mt-6 max-w-2xl text-muted-foreground">{DISPLAY_CONFIG.description}</p>
            </section>
        );
    }

    // DOM 结构与 CSS class 对应 styles.css 的 home-display-layer / home-portfolio-shutter
    return (
        <section
            ref={rootRef}
            className="home-display-layer"
            style={{ "--display-pillar-final-width": PILLAR_FINAL_WIDTH } as React.CSSProperties}
        >
            <div className="home-display-layer__viewport">
                {/* ===== 展示层 ===== */}
                <div className="home-display-layer__line" />
                <div className="home-display-layer__pillar" />
                <div className="home-display-layer__stage">
                    <p className="home-display-layer__kicker">{DISPLAY_CONFIG.kicker}</p>
                    <h2 className="home-display-layer__title">{DISPLAY_CONFIG.title}</h2>
                    <p className="home-display-layer__description">{DISPLAY_CONFIG.description}</p>
                </div>

                {/* ===== 百叶窗最终图三层（从后到前：视频 / 中景 / 前景）===== */}
                <video
                    className="home-portfolio-shutter__final-video"
                    src="/home/final-video.webm"
                    muted
                    loop
                    playsInline
                    tabIndex={-1}
                    preload="none"
                    aria-hidden="true"
                />
                <img
                    className="home-portfolio-shutter__final-image home-portfolio-shutter__final-image--midground"
                    src="/home/final-midground.webp"
                    alt=""
                    loading="eager"
                    decoding="async"
                />
                <img
                    className="home-portfolio-shutter__final-image home-portfolio-shutter__final-image--foreground"
                    src="/home/final-foreground.webp"
                    alt=""
                    loading="eager"
                    decoding="async"
                />

                <div className="home-portfolio-shutter__mask" />

                {/* ===== 百叶窗 5 张长条图 ===== */}
                <div className="home-portfolio-shutter__rail" aria-hidden="true">
                    {SHUTTER_PANELS.map((panel, index) => (
                        <article
                            key={panel.english}
                            className="home-portfolio-shutter__panel"
                            data-direction={panel.direction}
                            style={{ ["--panel-index" as string]: index }}
                        >
                            <img
                                className="home-portfolio-shutter__panel-image"
                                src={panel.image}
                                alt=""
                                loading="lazy"
                                decoding="async"
                            />
                            <div
                                className="home-portfolio-shutter__panel-copy"
                                style={{ ["--panel-image" as string]: `url(${panel.image})` }}
                            >
                                <div className="home-portfolio-shutter__panel-title-bar">
                                    <span className="home-portfolio-shutter__panel-label">
                                        {panel.english}
                                    </span>
                                    <strong>{panel.title}</strong>
                                    <span className="home-portfolio-shutter__panel-description">
                                        {panel.description}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* ===== Interlude 三层 ===== */}
                <div className="home-portfolio-shutter__interlude" aria-hidden="true">
                    <div className="home-portfolio-shutter__interlude-bg" />
                    <div className="home-portfolio-shutter__interlude-strips">
                        <img
                            className="home-portfolio-shutter__interlude-strip home-portfolio-shutter__interlude-strip--left"
                            src="/home/interlude-left.webp"
                            alt=""
                            loading="lazy"
                            decoding="async"
                        />
                        <img
                            className="home-portfolio-shutter__interlude-strip home-portfolio-shutter__interlude-strip--right"
                            src="/home/interlude-right.webp"
                            alt=""
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <div className="home-portfolio-shutter__interlude-copy">
                        <span className="home-portfolio-shutter__interlude-copy-text home-portfolio-shutter__interlude-copy-text--left">
                            Mi
                        </span>
                        <span className="home-portfolio-shutter__interlude-copy-text home-portfolio-shutter__interlude-copy-text--right">
                            Mo
                        </span>
                    </div>
                    <img
                        className="home-portfolio-shutter__interlude-fg"
                        src="/home/interlude-fg.webp"
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                {/* ===== 最终文字 ===== */}
                <div className="home-portfolio-shutter__final-copy">
                    <p>{SHUTTER_CONFIG.kicker}</p>
                    <h2>{SHUTTER_CONFIG.title}</h2>
                    <span>{SHUTTER_CONFIG.description}</span>
                </div>
            </div>
        </section>
    );
}

/** pin 总滚动距离：展示层距离 + 百叶窗距离 */
function getPinEnd(): string {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const displayDistance = Math.max(4000, vh * 4);
    const shutterDistance = Math.max(6000, vh * 4);
    return `+=${displayDistance + shutterDistance}`;
}

/** 百叶窗 merge 起点 */
function getShutterMergeStart(): number {
    return Number((5 * SHUTTER_PANEL_STEP + SHUTTER_MERGE_DELAY).toFixed(2));
}

/**
 * syncTitleBarClipPaths — 计算 title-bar 在 panel-copy 内的偏移，
 * 设置 --title-bar-clip-top/bottom，让 panel-copy::before 的灰度背景
 * 只显示在 title-bar 那一条带（而非覆盖整张图）。
 */
function syncTitleBarClipPaths(root: HTMLElement) {
    const copies = Array.from(
        root.querySelectorAll<HTMLElement>(".home-portfolio-shutter__panel-copy"),
    );
    for (const copy of copies) {
        const titleBar = copy.querySelector<HTMLElement>(
            ".home-portfolio-shutter__panel-title-bar",
        );
        if (!titleBar) continue;
        const top = titleBar.offsetTop;
        const bottom = copy.clientHeight - top - titleBar.offsetHeight;
        copy.style.setProperty("--title-bar-clip-top", `${top}px`);
        copy.style.setProperty("--title-bar-clip-bottom", `${bottom}px`);
    }
}
