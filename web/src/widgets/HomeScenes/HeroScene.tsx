import { useSettings } from "@features/settings/api/queries";
import { usePrefersReducedMotion } from "@shared/lib/hooks/use-media-query";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import "./home-scenes.css";

/**
 * HeroScene — 首页取景器首屏
 *
 * 全屏背景图 + 双栏布局（左 87% / 右 13%）：
 *   外四角取景框 + 中心对焦框 + 拍摄参数面板 +
 *   左侧头像/状态牌/职业/大字名字（逐字入场）/徽章 + 底部磨砂玻璃对话框 +
 *   右侧垂直排版面板（BLOG/垂直标题/菱形/微文本）。
 * 入场用 GSAP timeline 分阶段揭示。
 * DOM 结构与 CSS class 对应 styles.css 的 home-hero。
 * reduced-motion/移动端跳过动画直接显示（移动端隐藏取景器/对话框/右栏）。
 */
export default function HeroScene() {
    const { data: settings } = useSettings();
    const rootRef = useRef<HTMLElement>(null);
    const reduced = usePrefersReducedMotion();

    const displayName = settings?.site_name || "MIMO";
    const occupation = settings?.tech_stack || "全栈博客平台";
    const bio = settings?.bio || settings?.site_description || "";
    const nameBadge = settings?.github_username ? `GitHub：${settings.github_username}` : "";
    const nameLetters = Array.from(displayName);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        // 移动端/reduced-motion：跳过动画，直接就绪
        if (reduced || !window.matchMedia("(min-width: 769px)").matches) {
            root.classList.remove("home-hero--motion-pending");
            root.classList.add("home-hero--motion-ready");
            return;
        }

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
            const q = (sel: string) => root.querySelectorAll(sel);

            tl.fromTo(
                q(".home-hero__viewfinder-corner"),
                { autoAlpha: 0, scale: 0.3 },
                { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: "expo.out" },
                0.1,
            )
                .fromTo(
                    q(".home-hero__focus-frame"),
                    { autoAlpha: 0, scale: 1.7 },
                    { autoAlpha: 1, scale: 1, duration: 0.85, ease: "expo.out" },
                    0.45,
                )
                .fromTo(
                    q(".home-hero__camera-params"),
                    { autoAlpha: 0, x: -16 },
                    { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out" },
                    0.95,
                )
                .fromTo(
                    q(".home-hero__occupation"),
                    { autoAlpha: 0, y: 48 },
                    { autoAlpha: 1, y: 0, duration: 0.92, ease: "expo.out" },
                    0.82,
                )
                .fromTo(
                    q(".home-hero__name-letter"),
                    { autoAlpha: 0, y: 60, scale: 0.82 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.92,
                        stagger: 0.08,
                        ease: "expo.out",
                    },
                    0.98,
                )
                .fromTo(
                    q(".home-hero__speech-inner"),
                    { autoAlpha: 0, y: 34, scale: 0.92, filter: "blur(10px)" },
                    {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        duration: 0.92,
                        ease: "expo.out",
                    },
                    2.12,
                )
                .fromTo(
                    q(".home-hero__right-panel"),
                    { autoAlpha: 0, x: 60 },
                    { autoAlpha: 1, x: 0, duration: 0.95, ease: "power3.out" },
                    1.66,
                );
        }, rootRef);

        root.classList.remove("home-hero--motion-pending");
        root.classList.add("home-hero--motion-ready");
        return () => ctx.revert();
    }, [reduced]);

    return (
        <section ref={rootRef} className="home-hero home-hero--motion-pending" id="home-hero">
            {/* 背景图 */}
            <picture className="home-hero__video-picture">
                <img className="home-hero__video" src="/home/hero-bg.webp" alt="" />
            </picture>

            {/* 全屏内容容器：左 87% / 右 13% */}
            <div className="home-hero__canvas-container" id="main-canvas">
                {/* 外四角取景框 */}
                <div className="home-hero__viewfinder" aria-hidden="true">
                    <div className="home-hero__viewfinder-corner home-hero__viewfinder-corner--tl" />
                    <div className="home-hero__viewfinder-corner home-hero__viewfinder-corner--tr" />
                    <div className="home-hero__viewfinder-corner home-hero__viewfinder-corner--bl" />
                    <div className="home-hero__viewfinder-corner home-hero__viewfinder-corner--br" />
                </div>

                {/* 拍摄参数面板 */}
                <div className="home-hero__camera-params" aria-hidden="true">
                    <span>MNL</span>
                    <span>1/125</span>
                    <span>OPEN</span>
                    <span>3dB</span>
                </div>

                {/* 中心对焦框 */}
                <div className="home-hero__focus-frame" aria-hidden="true">
                    <div className="home-hero__focus-corner home-hero__focus-corner--tl" />
                    <div className="home-hero__focus-corner home-hero__focus-corner--tr" />
                    <div className="home-hero__focus-corner home-hero__focus-corner--bl" />
                    <div className="home-hero__focus-corner home-hero__focus-corner--br" />
                    <div className="home-hero__focus-dot" />
                </div>

                {/* 左侧面板 */}
                <section className="home-hero__left-panel">
                    <div className="home-hero__profile">
                        <div className="home-hero__identity-row">
                            {/* 头像 + 状态牌 */}
                            <div className="home-hero__avatar-group">
                                <div className="home-hero__avatar-wrapper">
                                    <img
                                        src="/logo512.png"
                                        alt="avatar"
                                        className="home-hero__avatar"
                                        id="hero-avatar"
                                        loading="eager"
                                    />
                                </div>
                                <div className="home-hero__status-badge" id="work-status">
                                    <span className="home-hero__status-dot" />
                                    <span className="home-hero__status-text">在线</span>
                                </div>
                            </div>

                            {/* 职业 + 名字 + 徽章 */}
                            <div className="home-hero__name-group">
                                {occupation ? (
                                    <p className="home-hero__occupation">{occupation}</p>
                                ) : null}
                                <h1 className="home-hero__name home-hero__name--rainbow">
                                    {nameLetters.map((letter, i) => (
                                        <span
                                            key={`${letter}-${i}`}
                                            className="home-hero__name-letter"
                                        >
                                            {letter === " " ? "\u00A0" : letter}
                                        </span>
                                    ))}
                                </h1>
                                {nameBadge ? (
                                    <div className="home-hero__name-badge">{nameBadge}</div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 底部磨砂玻璃对话框 */}
                {bio ? (
                    <div className="home-hero__speech" role="img" aria-label={`简介：${bio}`}>
                        <div className="home-hero__speech-inner">
                            <p className="home-hero__speech-text">{bio}</p>
                        </div>
                    </div>
                ) : null}

                {/* 右侧垂直排版面板 */}
                <aside className="home-hero__right-panel">
                    <div className="home-hero__pill">BLOG</div>
                    <div className="home-hero__vertical-wrap">
                        <span className="home-hero__v-title">博客</span>
                        <span className="home-hero__v-sub">{displayName}</span>
                        <span className="home-hero__diamond">✦</span>
                        <span className="home-hero__v-sub">CREATIVE</span>
                    </div>
                    <div className="home-hero__panel-footer">
                        <div className="home-hero__footer-line" />
                        <p className="home-hero__micro-text">システム起動完了</p>
                    </div>
                </aside>
            </div>
        </section>
    );
}
