"use client";

import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes, forwardRef, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 磁性强度 */
  strength?: number;
  /** 按钮外观变体 */
  variant?: "default" | "outline" | "ghost";
  /** 按钮尺寸 */
  size?: "default" | "sm" | "lg" | "icon";
  /** 将样式与事件合并到子元素 */
  asChild?: boolean;
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
    {
      children,
      className,
      strength = 0.3,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLButtonElement | HTMLElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    function setRefs(element: HTMLButtonElement | HTMLElement | null) {
      innerRef.current = element;
      if (typeof forwardedRef === "function") {
        forwardedRef(element as HTMLButtonElement);
      } else if (forwardedRef) {
        forwardedRef.current = element as HTMLButtonElement;
      }
    }

    function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
      if (props.disabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;
      setPosition({ x, y });
    }

    function handleMouseLeave() {
      setPosition({ x: 0, y: 0 });
    }

    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={asChild ? undefined : setRefs}
        type={asChild ? undefined : "button"}
        className={classes}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onMouseMove={handleMouseMove as unknown as React.MouseEventHandler<HTMLButtonElement>}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
