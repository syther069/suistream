import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "focus-ring h-11 w-full rounded-lg border border-outline-soft bg-surface-low px-3 text-sm text-on-surface placeholder:text-on-muted/55 focus:border-primary",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "focus-ring min-h-28 w-full rounded-lg border border-outline-soft bg-surface-low px-3 py-3 text-sm text-on-surface placeholder:text-on-muted/55 focus:border-primary",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
