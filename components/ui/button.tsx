import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-on-primary shadow-primary-soft hover:brightness-110",
  secondary:
    "border-outline-soft bg-surface-high text-on-surface hover:bg-surface-highest",
  ghost:
    "border-transparent bg-transparent text-on-muted hover:border-outline-soft hover:bg-surface-low",
  outline:
    "border-outline-soft bg-transparent text-on-surface hover:bg-surface-container",
  danger:
    "border-danger/30 bg-danger/15 text-danger hover:bg-danger/25"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
