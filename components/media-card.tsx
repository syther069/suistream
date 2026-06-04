"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageOff, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagList } from "@/components/tag-list";
import { TipModal } from "@/components/TipModal";
import type { MediaContent } from "@/lib/types";
import { cn, shortenAddress } from "@/lib/utils";

function WalrusImage({
  src,
  alt,
  className
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-high text-on-muted",
          className
        )}
      >
        <ImageOff className="h-8 w-8 opacity-40" />
        <span className="text-[10px] opacity-50">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

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
        <WalrusImage
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/90 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">Walrus</Badge>
            <Badge>AI Tagged</Badge>
          </div>
        </div>
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
