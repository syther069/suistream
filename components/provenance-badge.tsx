import { CheckCircle2, Cloud, Fingerprint, ShieldCheck } from "lucide-react";
import type { MediaContent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from "@/lib/utils";

export function ProvenanceBadge({ content }: { content: MediaContent }) {
  const rows = [
    ["Walrus Blob ID", content.mediaBlobId, Cloud],
    ["Metadata Blob", content.metadataBlobId, Fingerprint],
    ["Sui Object ID", content.suiObjectId, ShieldCheck]
  ] as const;

  return (
    <div className="rounded-lg border border-outline-soft bg-surface-container">
      <div className="flex items-center justify-between border-b border-outline-soft px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Provenance</h2>
        </div>
        <Badge tone={content.isDemo ? "warning" : "primary"}>
          {content.isDemo ? "Demo" : "Verified"}
        </Badge>
      </div>
      <div className="space-y-4 p-5">
        {rows.map(([label, value, Icon]) => (
          <div
            key={label}
            className="border-l-2 border-primary bg-surface-low px-4 py-3"
          >
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-on-muted">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <code className="block truncate font-mono text-xs text-primary">
              {shortenAddress(value, 18, 8)}
            </code>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-outline-soft bg-surface-high p-3 text-center">
            <Cloud className="mx-auto mb-1 h-5 w-5 text-primary" />
            <div className="text-xs font-semibold">Walrus Stored</div>
            <div className="text-[10px] text-on-muted">3 epochs</div>
          </div>
          <div className="rounded-lg border border-outline-soft bg-surface-high p-3 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-primary" />
            <div className="text-xs font-semibold">AI Approved</div>
            <div className="text-[10px] text-on-muted">
              {(content.safetyScore * 100).toFixed(0)}% safe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
