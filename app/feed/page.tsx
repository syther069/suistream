"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { PACKAGE_ID, WALRUS_AGGREGATOR_URL } from "@/lib/config";
import { suiclient } from "@/lib/sui-client";
import type { MediaContent, ModerationStatus } from "@/lib/types";

const categories = [
  "All Content",
  "Generative Art",
  "Motion Graphics",
  "3D Architecture",
  "Hyper-Surrealism",
  "AI Portraits"
];

type FeedEvent = {
  id?: {
    txDigest?: string;
  };
  timestampMs?: string;
  parsedJson?: Record<string, unknown>;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item: unknown): item is string => typeof item === "string")
    : [];
}

function moderationStatusValue(value: unknown): ModerationStatus {
  return value === "flagged" ? "flagged" : "approved";
}

function blobUrl(blobId: string) {
  return blobId ? `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}` : "";
}

function mapContentCreatedEvent(event: FeedEvent): MediaContent | null {
  const fields = event.parsedJson;

  if (!fields) {
    return null;
  }

  const objectId =
    stringValue(fields.object_id) ||
    stringValue(fields.objectId) ||
    stringValue(fields.content_id) ||
    stringValue(fields.contentId) ||
    stringValue(fields.id);
  const mediaBlobId =
    stringValue(fields.media_blob_id) ||
    stringValue(fields.mediaBlobId) ||
    stringValue(fields.blob_id) ||
    stringValue(fields.blobId);
  const metadataBlobId =
    stringValue(fields.metadata_blob_id) ||
    stringValue(fields.metadataBlobId) ||
    stringValue(fields.metadata_id) ||
    stringValue(fields.metadataId);
  const creator =
    stringValue(fields.creator) ||
    stringValue(fields.creator_address) ||
    stringValue(fields.creatorAddress);
  const title = stringValue(fields.title) || "Untitled stream";

  if (!objectId || !creator || !mediaBlobId) {
    return null;
  }

  const timestamp =
    stringValue(fields.created_at) ||
    stringValue(fields.createdAt) ||
    event.timestampMs ||
    String(Date.now());

  return {
    id: objectId,
    title,
    description: stringValue(fields.description),
    creator: creator.slice(0, 10),
    creatorAddress: creator,
    createdAt: new Date(numberValue(timestamp)).toISOString(),
    imageUrl: blobUrl(mediaBlobId),
    aspect: "landscape",
    tags: stringArrayValue(fields.tags),
    moderationStatus: moderationStatusValue(fields.moderationStatus),
    contentHash:
      stringValue(fields.content_hash) || stringValue(fields.contentHash),
    mediaBlobId,
    metadataBlobId,
    suiObjectId: objectId,
    mintTxId: event.id?.txDigest ?? "",
    safetyScore: numberValue(fields.safetyScore)
  };
}

export default function FeedPage() {
  const [items, setItems] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventType = useMemo(() => {
    return PACKAGE_ID ? `${PACKAGE_ID}::suistream::ContentCreated` : "";
  }, []);

  async function loadFeed() {
    if (!eventType) {
      setItems([]);
      setError("NEXT_PUBLIC_PACKAGE_ID is required before loading feed events.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await suiclient.queryEvents({
        query: {
          MoveEventType: eventType
        },
        limit: 50,
        order: "descending"
      });
      const mapped = response.data
        .map((event: FeedEvent) => mapContentCreatedEvent(event as FeedEvent))
        .filter((item: MediaContent | null): item is MediaContent => item !== null);

      setItems(mapped);
    } catch (caught) {
      setItems([]);
      setError(
        caught instanceof Error ? caught.message : "Unable to load feed events."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeed();
  }, [eventType]);

  return (
    <main className="pb-24 md:pb-0">
      <SiteHeader search />
      <section className="container-grid py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
            <p className="mt-2 text-on-muted">
              Approved content from Walrus storage and Sui provenance events.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-primary">
            {loading ? "Loading streams" : `${items.length} streams`}
          </div>
        </div>
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          {categories.map((category, index) => (
            <Button
              key={category}
              variant={index === 0 ? "primary" : "secondary"}
              size="sm"
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-lg border border-outline-soft bg-surface-container"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-outline-soft bg-surface-container p-6 text-center">
            <p className="max-w-xl text-sm text-danger">{error}</p>
            <Button onClick={loadFeed} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : items.length ? (
          <FeedGrid items={items} />
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-outline-soft bg-surface-low p-6 text-center text-sm text-on-muted">
            No content events found yet.
          </div>
        )}
        {loading ? (
          <div className="mt-10 flex justify-center text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : null}
      </section>
    </main>
  );
}
