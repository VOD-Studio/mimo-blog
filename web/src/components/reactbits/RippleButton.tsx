import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, type ReactNode, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const rippleButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-2.5",
        sm: "h-7 rounded-md px-2 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 px-3",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface RippleButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rippleButtonVariants> {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

/**
 * 涟漪按钮
 *
 * 点击时从触点扩散出水波纹反馈。
 */
export function RippleButton({
  children,
  className,
  variant,
  size,
  asChild = false,
  onClick,
  ...props
}: RippleButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot
        className={cn(rippleButtonVariants({ variant, size }), className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(rippleButtonVariants({ variant, size }), className)}
      onClick={handleClick}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute animate-ripple rounded-full bg-current opacity-20"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 1,
            height: 1,
          }}
        />
      ))}
      {children}
    </button>
  );
}
