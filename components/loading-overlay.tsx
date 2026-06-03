import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingOverlay({
  label,
  visible
}: {
  label: string;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-background/70 opacity-0 backdrop-blur-md transition-opacity",
        visible && "pointer-events-auto opacity-100"
      )}
    >
      <div className="rounded-lg border border-outline-soft bg-surface-container px-6 py-5 text-center">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
        <p className="font-mono text-xs uppercase tracking-wider text-on-muted">
          {label}
        </p>
      </div>
    </div>
  );
}
