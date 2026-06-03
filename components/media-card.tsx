import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagList } from "@/components/tag-list";
import { TipButton } from "@/components/tip-button";
import type { MediaContent } from "@/lib/types";
import { cn, shortenAddress } from "@/lib/utils";

export function MediaCard({ item }: { item: MediaContent }) {
  return (
    <article className="masonry-item overflow-hidden rounded-lg border border-outline-soft bg-surface-container transition-colors hover:border-primary/50">
      <Link
        href={`/content/${item.id}`}
        className={cn(
          "group relative block overflow-hidden bg-surface-low",
          item.aspect === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
        )}
      >
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/90 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex flex-wrap gap-2">
            {item.isDemo ? <Badge tone="warning">Demo</Badge> : null}
            <Badge tone="primary">Walrus</Badge>
            <Badge>AI Tagged</Badge>
          </div>
        </div>
        {item.isDemo ? (
          <div className="absolute left-3 top-3">
            <Badge tone="warning">Demo</Badge>
          </div>
        ) : null}
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/content/${item.id}`}
              className="font-semibold text-on-surface transition-colors hover:text-primary"
            >
              {item.title}
            </Link>
            <div className="mt-1 text-xs text-on-muted">
              {item.creator} / {shortenAddress(item.creatorAddress)}
            </div>
          </div>
          <button className="focus-ring rounded p-1.5 text-on-muted hover:bg-surface-high hover:text-on-surface">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
        <TagList tags={item.tags.slice(0, 3)} dense />
        <div className="flex items-center justify-between border-t border-outline-soft pt-3">
          <span className="font-mono text-xs text-on-muted">
            {item.isDemo ? "Demo preview" : shortenAddress(item.suiObjectId)}
          </span>
          <TipButton
            creator={item.creator}
            contentObjectId={item.isDemo ? undefined : item.suiObjectId}
            compact
            disabled={item.isDemo}
            disabledReason="Tipping not available on demo content"
          />
        </div>
      </div>
    </article>
  );
}
