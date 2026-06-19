"use client";

import { type ButtonHTMLAttributes, forwardRef, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 磁性强度 */
  strength?: number;
  /** 按钮外观变体 */
  variant?: "default" | "outline" | "ghost";
  /** 按钮尺寸 */
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm dark:shadow-none",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

/**
 * ReactBits 风格磁性按钮
 */
export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton(
    { children, className, strength = 0.3, variant = "default", size = "default", ...props },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    function setRefs(element: HTMLButtonElement | null) {
      innerRef.current = element;
      if (typeof forwardedRef === "function") {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    }

    function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
      if (props.disabled || !innerRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;
      setPosition({ x, y });
    }

    function handleMouseLeave() {
      setPosition({ x: 0, y: 0 });
    }

    return (
      <button
        ref={setRefs}
        type="button"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </button>
    );
  },
);
