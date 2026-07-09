import { useContributions, useRepos } from "@features/github/api/queries";
import { usePosts } from "@features/posts/api/queries";
import { useSettings } from "@features/settings/api/queries";
import { usePrefersReducedMotion } from "@shared/lib/hooks/use-media-query";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import LogoLoop from "./LogoLoop";

type Pill = {
    label: string;
    value: string | number;
    tone?: "dark" | "light" | "outline" | "solid";
};

/**
 * DataLayerScene — 站点数据 + 能力矩阵
 *
 * 3 行网格结构：
 *   heading：kicker(CONTEXT) + 站点数据(小) + 能力矩阵(巨大主标题)
 *   row1 top：两张 DataMetricCard（站点访问 square / 文章档案 wide），hover 遮罩球展开
 *   row2 band-contact：社交联系 intro + LogoLoop 横向轨道
 *   row3 band-skills：技能图标 intro + LogoLoop 横向轨道
 *
 * GSAP ScrollTrigger whileInView 逐元素揭示 + 卡片内 hover 球（pointerenter/leave）。
 * 移动端/reduced-motion 直接显示无 hover 球。
 * DOM 结构与 CSS class 对应 styles.css 的 home-data-layer / data-card / data-band。
 */
export default function DataLayerScene() {
    const { data: settings } = useSettings();
    const { data: posts } = usePosts({});
    const { data: contributions } = useContributions();
    const { data: repos } = useRepos();
    const reduced = usePrefersReducedMotion();
    const rootRef = useRef<HTMLElement>(null);

    const postList = posts?.data ?? [];
    const repoList = repos ?? [];

    const visitPills: Pill[] = [
        { label: "UV", value: "--", tone: "light" },
        { label: "PV", value: "--", tone: "dark" },
    ];
    const articlePills: Pill[] = [
        { label: "文章", value: postList.length, tone: "light" },
        { label: "贡献", value: contributions?.total_contributions ?? 0, tone: "solid" },
        { label: "项目", value: repoList.length, tone: "solid" },
    ];

    const socialItems = buildSocialItems(settings?.github_username);
    const skillItems = buildSkillItems(settings?.tech_stack);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        if (reduced || !window.matchMedia("(min-width: 769px)").matches) return;

        gsap.registerPlugin(ScrollTrigger);
        const cleanups: Array<() => void> = [];
        const timelines: gsap.core.Timeline[] = [];

        // ===== heading 错峰揭示 =====
        const headingTl = gsap.timeline({
            scrollTrigger: { trigger: ".home-data-layer__heading", start: "top 85%", once: true },
            defaults: { ease: "expo.out" },
        });
        const kicker = root.querySelector(".home-data-layer__kicker");
        const titleMain = root.querySelector(".home-data-layer__title-main");
        const titleMatrix = root.querySelector(".home-data-layer__title-matrix");
        if (kicker) {
            headingTl.fromTo(
                kicker,
                { autoAlpha: 0, y: 40, clipPath: "inset(100% 0 0 0)" },
                { autoAlpha: 1, y: 0, clipPath: "inset(0% 0 0 0)", duration: 0.9 },
                0,
            );
        }
        if (titleMain) {
            headingTl.fromTo(
                titleMain,
                {
                    autoAlpha: 0,
                    y: 70,
                    scaleX: 0.88,
                    clipPath: "inset(0 100% 0 0)",
                    transformOrigin: "0% 50%",
                },
                { autoAlpha: 1, y: 0, scaleX: 1, clipPath: "inset(0 0% 0 0)", duration: 1.1 },
                0.12,
            );
        }
        if (titleMatrix) {
            headingTl.fromTo(
                titleMatrix,
                {
                    autoAlpha: 0,
                    y: 120,
                    scaleY: 0.8,
                    clipPath: "inset(0 0 100% 0)",
                    transformOrigin: "50% 0%",
                },
                { autoAlpha: 1, y: 0, scaleY: 1, clipPath: "inset(0 0 0% 0)", duration: 1.2 },
                0.28,
            );
        }
        timelines.push(headingTl);

        // ===== top row 卡片揭示 =====
        const topRow = root.querySelector(".home-data-layer__row--top");
        if (topRow) {
            const cards = Array.from(topRow.querySelectorAll<HTMLElement>(".data-card"));
            const cardTl = gsap.timeline({
                scrollTrigger: { trigger: topRow, start: "top 82%", once: true },
                defaults: { ease: "expo.out" },
            });
            cardTl.fromTo(
                cards,
                {
                    autoAlpha: 0,
                    y: 90,
                    rotateX: 10,
                    filter: "blur(10px)",
                    transformOrigin: "50% 100%",
                },
                {
                    autoAlpha: 1,
                    y: 0,
                    rotateX: 0,
                    filter: "blur(0px)",
                    duration: 1.15,
                    stagger: 0.18,
                },
                0,
            );
            // 卡片内元素错峰
            cards.forEach((card, index) => {
                const eyebrow = card.querySelector(".data-card__eyebrow");
                const title = card.querySelector(".data-card__title");
                const detail = card.querySelector(".data-card__detail");
                const visual = card.querySelector<HTMLElement>(".data-card__visual");
                const innerDelay = 0.35 + index * 0.18;
                if (eyebrow) {
                    cardTl.fromTo(
                        eyebrow,
                        { autoAlpha: 0, y: 24, clipPath: "inset(0 0 100% 0)" },
                        { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.75 },
                        innerDelay,
                    );
                }
                if (title) {
                    cardTl.fromTo(
                        title,
                        {
                            autoAlpha: 0,
                            y: 30,
                            scaleX: 0.94,
                            clipPath: "inset(0 100% 0 0)",
                            transformOrigin: "0% 50%",
                        },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scaleX: 1,
                            clipPath: "inset(0 0% 0 0)",
                            duration: 0.85,
                        },
                        innerDelay + 0.08,
                    );
                }
                if (detail) {
                    cardTl.fromTo(
                        detail,
                        { autoAlpha: 0, y: 20 },
                        { autoAlpha: 1, y: 0, duration: 0.7 },
                        innerDelay + 0.18,
                    );
                }
                if (visual) {
                    cardTl.fromTo(
                        visual,
                        { clipPath: "inset(100% 0 0 0)", scale: 1.06 },
                        {
                            clipPath: "inset(0% 0 0 0)",
                            scale: 1,
                            duration: 1.05,
                            ease: "power3.inOut",
                        },
                        innerDelay - 0.1,
                    );
                }
            });
            timelines.push(cardTl);
        }

        // ===== hover 球（仅 hover 设备 + 非 reduced-motion）=====
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (canHover) {
            const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card-interactive]"));
            cards.forEach((card) => {
                const hover = card.querySelector<HTMLElement>(".data-card__hover");
                const orb = card.querySelector<HTMLElement>(".data-card__hover-orb");
                const header = card.querySelector<HTMLElement>(".data-card__hover-header");
                const hoverTitle = card.querySelector<HTMLElement>(".data-card__hover-title");
                const pills = Array.from(
                    card.querySelectorAll<HTMLElement>(".data-card__hover-pill"),
                );
                if (!hover || !orb || !header || !hoverTitle || pills.length === 0) return;

                const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
                tl.set(hover, { autoAlpha: 1 })
                    .fromTo(
                        orb,
                        { xPercent: -50, yPercent: -50, scale: 0.18 },
                        {
                            xPercent: -50,
                            yPercent: -50,
                            scale: 1,
                            duration: 0.58,
                            ease: "expo.out",
                        },
                        0,
                    )
                    .fromTo(
                        [header, hoverTitle],
                        { autoAlpha: 0, y: 18 },
                        { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.05 },
                        0.38,
                    )
                    .fromTo(
                        pills,
                        { autoAlpha: 0, y: -44, scale: 0.82 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.44,
                            stagger: 0.08,
                            ease: "back.out(1.7)",
                        },
                        0.5,
                    );

                const enter = () => tl.play();
                const leave = () => tl.reverse();
                card.addEventListener("pointerenter", enter);
                card.addEventListener("pointerleave", leave);
                cleanups.push(() => {
                    card.removeEventListener("pointerenter", enter);
                    card.removeEventListener("pointerleave", leave);
                    tl.kill();
                });
            });
        }

        // ===== 两条 band 揭示 =====
        const bands = Array.from(root.querySelectorAll<HTMLElement>(".data-band"));
        bands.forEach((band) => {
            const bandTl = gsap.timeline({
                scrollTrigger: { trigger: band, start: "top 82%", once: true },
                defaults: { ease: "expo.out" },
            });
            const eyebrow = band.querySelector(".data-band__eyebrow");
            const title = band.querySelector(".data-band__content h3");
            const desc = band.querySelector<HTMLElement>(
                ".data-band__content p:not(.data-band__eyebrow)",
            );
            const visual = band.querySelector<HTMLElement>(".data-band__visual");
            const loop = band.querySelector<HTMLElement>(".data-band__loop");
            if (eyebrow) {
                bandTl.fromTo(
                    eyebrow,
                    {
                        autoAlpha: 0,
                        y: 60,
                        scaleX: 0.92,
                        clipPath: "inset(0 0 100% 0)",
                        transformOrigin: "50% 100%",
                    },
                    { autoAlpha: 1, y: 0, scaleX: 1, clipPath: "inset(0 0 0% 0)", duration: 1.05 },
                    0,
                );
            }
            if (title) {
                bandTl.fromTo(
                    title,
                    {
                        autoAlpha: 0,
                        y: 45,
                        clipPath: "inset(0 100% 0 0)",
                        transformOrigin: "0% 50%",
                    },
                    { autoAlpha: 1, y: 0, clipPath: "inset(0 0% 0 0)", duration: 0.95 },
                    0.14,
                );
            }
            if (desc) {
                bandTl.fromTo(
                    desc,
                    { autoAlpha: 0, y: 30 },
                    { autoAlpha: 1, y: 0, duration: 0.8 },
                    0.28,
                );
            }
            if (visual) {
                bandTl.fromTo(
                    visual,
                    { clipPath: "inset(100% 0 0 0)", scale: 1.08 },
                    { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 1.2, ease: "power3.inOut" },
                    0.1,
                );
            }
            if (loop) {
                bandTl.fromTo(
                    loop,
                    { autoAlpha: 0, y: 40, filter: "blur(8px)" },
                    { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.95 },
                    0.45,
                );
            }
            timelines.push(bandTl);
        });

        const ctx = gsap.context(() => {}, rootRef);
        return () => {
            ctx.revert();
            cleanups.forEach((c) => {
                c();
            });
            timelines.forEach((t) => {
                t.kill();
            });
            ScrollTrigger.getAll().forEach((st) => {
                st.kill();
            });
        };
    }, [reduced]);

    return (
        <section ref={rootRef} className="home-data-layer" id="home-data-layer">
            <div className="home-data-layer__inner">
                {/* heading */}
                <div className="home-data-layer__heading">
                    <p className="home-data-layer__kicker">CONTEXT</p>
                    <h2 className="home-data-layer__title-main">站点数据</h2>
                    <h2 className="home-data-layer__title-matrix">能力矩阵</h2>
                </div>

                {/* 3 行网格 */}
                <div className="home-data-layer__grid">
                    {/* row1 top */}
                    <div className="home-data-layer__row home-data-layer__row--top">
                        <DataMetricCard
                            title="站点访问"
                            eyebrow="VISITS"
                            detail="访客与浏览统计载入中"
                            icon="visibility"
                            hoverTitle="访问轨迹"
                            hoverCode="01"
                            variant="square"
                            pills={visitPills}
                        />
                        <DataMetricCard
                            title="文章档案"
                            eyebrow="ARCHIVE"
                            detail={`${postList.length} 篇文章 / ${(contributions?.total_contributions ?? 0).toLocaleString()} 次贡献 / ${repoList.length} 个项目`}
                            icon="article"
                            hoverTitle="内容索引"
                            hoverCode="02"
                            variant="wide"
                            pills={articlePills}
                        />
                    </div>

                    {/* row2 contact band */}
                    <div className="home-data-layer__row home-data-layer__row--band">
                        <section
                            className="data-band data-band--contact"
                            aria-labelledby="home-contact-title"
                        >
                            <div className="data-band__intro">
                                <div className="data-band__frame" />
                                <div className="data-band__visual" aria-hidden="true">
                                    <img
                                        src="/home/data-contact.webp"
                                        alt=""
                                        className="data-band__visual-img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="data-band__content">
                                    <p className="data-band__eyebrow">CONTACT</p>
                                    <h3 id="home-contact-title">社交联系</h3>
                                    <p>把散落的入口收束在一条缓慢移动的轨道里。</p>
                                </div>
                            </div>
                            <div className="data-band__loop">
                                <LogoLoop items={socialItems} speed={86} />
                            </div>
                        </section>
                    </div>

                    {/* row3 skills band */}
                    <div className="home-data-layer__row home-data-layer__row--band">
                        <section
                            className="data-band data-band--skills"
                            aria-labelledby="home-skills-title"
                        >
                            <div className="data-band__intro">
                                <div className="data-band__frame" />
                                <div className="data-band__visual" aria-hidden="true">
                                    <img
                                        src="/home/data-skills.webp"
                                        alt=""
                                        className="data-band__visual-img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="data-band__content">
                                    <p className="data-band__eyebrow">SKILLS</p>
                                    <h3 id="home-skills-title">技能图标</h3>
                                    <p>工程、内容和部署工具在同一条轨道上循环。</p>
                                </div>
                            </div>
                            <div className="data-band__loop">
                                <LogoLoop
                                    items={skillItems}
                                    speed={74}
                                    direction="right"
                                    iconOnly
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * DataMetricCard — 数据指标卡
 *
 * 默认态：边框 + 背景图/SVG 装饰 + eyebrow/title/detail。
 * hover 态（桌面 hover 设备）：遮罩球从底部展开覆盖 + 大标题 + 胶囊 pill 错落弹出。
 * variant: square（方形 1fr）/ wide（宽形 2fr）。
 */
function DataMetricCard({
    title,
    detail,
    icon,
    eyebrow,
    hoverTitle,
    hoverCode,
    variant = "square",
    pills,
    visualImage,
}: {
    title: string;
    detail: string;
    icon: string;
    eyebrow: string;
    hoverTitle: string;
    hoverCode: string;
    variant?: "square" | "wide";
    pills: Pill[];
    visualImage?: string;
}) {
    return (
        <article
            className={`data-card data-card--metric data-card--${variant}`}
            data-card-interactive
        >
            <div className="data-card__frame" />
            <div
                className={`data-card__visual${visualImage ? " data-card__visual--image" : ""}`}
                aria-hidden="true"
            >
                {visualImage ? (
                    <img
                        src={visualImage}
                        alt=""
                        className="data-card__visual-img"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <svg
                        viewBox="0 0 400 260"
                        className="data-card__svg"
                        aria-hidden="true"
                        role="presentation"
                    >
                        <path
                            className="data-card__svg-path"
                            d="M20 210 C 90 120, 150 260, 230 146 S 340 90, 382 38"
                        />
                        <circle
                            className="data-card__svg-dot data-card__svg-dot--a"
                            cx="92"
                            cy="78"
                            r="34"
                        />
                        <circle
                            className="data-card__svg-dot data-card__svg-dot--b"
                            cx="306"
                            cy="172"
                            r="52"
                        />
                    </svg>
                )}
            </div>
            <div className="data-card__content">
                <span className="data-card__icon" aria-hidden="true">
                    {icon === "visibility" ? "◉" : "❏"}
                </span>
                <p className="data-card__eyebrow">{eyebrow}</p>
                <h3 className="data-card__title">{title}</h3>
                <p className="data-card__detail">{detail}</p>
            </div>
            <div className="data-card__hover" aria-hidden="true">
                <div className="data-card__hover-orb" />
                <div className="data-card__hover-header">
                    <span className="data-card__hover-code">{hoverCode}</span>
                    <span className="data-card__hover-system">SYSTEM</span>
                </div>
                <h3 className="data-card__hover-title">
                    {hoverTitle}
                    <span>.</span>
                </h3>
            </div>
            <div className="data-card__hover-pills" aria-hidden="true">
                {pills.map((pill, index) => (
                    <span
                        key={pill.label}
                        className={`data-card__hover-pill data-card__hover-pill--${pill.tone || "light"}`}
                        style={{ ["--pill-index" as string]: index }}
                    >
                        <span>{pill.label}</span>
                        <strong>{pill.value}</strong>
                    </span>
                ))}
            </div>
        </article>
    );
}

/** 从 github 用户名派生社交链接项 */
function buildSocialItems(githubUsername?: string) {
    const items: Array<{ name: string; href?: string }> = [];
    if (githubUsername) {
        items.push({ name: "GitHub", href: `https://github.com/${githubUsername}` });
    }
    items.push(
        { name: "Email", href: "mailto:nobody@example.com" },
        { name: "RSS", href: "/rss.xml" },
    );
    return items;
}

/** 从 tech_stack 解析技能项（逗号/顿号分隔），无则占位 */
function buildSkillItems(techStack?: string) {
    if (!techStack)
        return ["React", "Go", "PostgreSQL", "Redis", "Tailwind", "TypeScript"].map((n) => ({
            name: n,
        }));
    return techStack
        .split(/[,、·/]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ name: s }));
}
