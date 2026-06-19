"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface ParticleBackgroundProps {
  className?: string;
  quantity?: number;
  staticity?: number;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  friction: number;
  ease: number;
}

/**
 * ReactBits 风格粒子网络背景
 */
export function ParticleBackground({
  className,
  quantity = 80,
  staticity = 50,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles();
    }

    function getColor() {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "255, 255, 255" : "15, 23, 42";
    }

    function initParticles() {
      const particles: Particle[] = [];
      const color = getColor();
      const width = window.innerWidth;
      const height = window.innerHeight;

      for (let i = 0; i < quantity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          originX: x,
          originY: y,
          size: Math.random() * 2 + 1,
          color,
          vx: 0,
          vy: 0,
          friction: 0.9,
          ease: Math.random() * 0.05 + 0.02,
        });
      }
      particlesRef.current = particles;
    }

    function draw() {
      if (!canvas || !ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const color = getColor();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.color = color;

        if (!prefersReducedMotion) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = staticity;
          const force = (maxDistance - distance) / maxDistance;

          if (distance < staticity) {
            p.vx += forceDirectionX * force * p.ease;
            p.vy += forceDirectionY * force * p.ease;
          }

          p.x += (p.originX - p.x) * 0.02 + p.vx;
          p.y += (p.originY - p.y) * 0.02 + p.vy;
          p.vx *= p.friction;
          p.vy *= p.friction;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, 0.6)`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${p.color}, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function handleMouseMove(event: MouseEvent) {
      mouseRef.current = { x: event.clientX, y: event.clientY };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [quantity, staticity]);

  return (
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: canvas is decorative, pointer-events-none, not focusable
    <canvas
      ref={canvasRef}
      role="presentation"
      className={cn("pointer-events-none fixed inset-0 -z-10", className)}
    />
  );
}
