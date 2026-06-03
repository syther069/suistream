import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "primary" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  default: "border-outline-soft bg-surface-high text-on-muted",
  primary: "border-primary/25 bg-primary/10 text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger"
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-1 font-mono text-[11px] uppercase leading-none",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
