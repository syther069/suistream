"use client";


import { Badge } from "@/components/ui/badge";
import { TagList } from "@/components/tag-list";
import { TipModal } from "@/components/TipModal";
import type { MediaContent } from "@/lib/types";
import { cn, shortenAddress } from "@/lib/utils";


export function MediaCard({ item }: { item: MediaContent }) {
  return (
    <article className="masonry-item overflow-hidden rounded-lg border border-outline-soft bg-surface-container transition-colors hover:border-primary/50">
      <div
        className={cn(
          "group relative block overflow-hidden bg-surface-low",
          item.aspect === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
        )}
      >
        <img
          src={`https://aggregator.walrus.space/v1/${item.mediaBlobId}`}
          alt={item.title}
          style={{ width:'100%', height:'220px', objectFit:'cover', borderRadius:'8px 8px 0 0' }}
          onError={(e) => { e.currentTarget.style.display='none' }}
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/90 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">Walrus</Badge>
            <Badge>AI Tagged</Badge>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-on-surface">
              {item.title}
            </h3>
            <div className="mt-1 text-xs text-on-muted">
              {item.creator} / {shortenAddress(item.creatorAddress)}
            </div>
          </div>
        </div>
        <TagList tags={item.tags.slice(0, 3)} dense />
        <div className="flex items-center justify-between border-t border-outline-soft pt-3">
          <span className="font-mono text-xs text-on-muted">
            {shortenAddress(item.suiObjectId)}
          </span>
          <TipModal
            creator={item.creator}
            creatorAddress={item.creatorAddress}
            contentObjectId={item.suiObjectId}
            compact
          />
        </div>
      </div>
    </article>
  );
}
