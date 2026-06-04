"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
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
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-high text-on-muted",
          className
        )}
      >
        <ImageOff className="h-8 w-8 opacity-40" />
        <span className="text-[10px] opacity-50">No image</span>
      </div>
    );
  }

  if (errored) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={(event) => {
        event.currentTarget.style.display = "none";
        setErrored(true);
      }}
    />
  );
}

export function MediaCard({ item }: { item: MediaContent }) {
  return (
    <article className="masonry-item overflow-hidden rounded-lg border border-outline-soft bg-surface-container transition-colors hover:border-primary/50">
      <div
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
