"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { PACKAGE_ID } from "@/lib/config";

import { useSuiClient } from "@mysten/dapp-kit";
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

type SuiObjectResponse = {
  data?: {
    objectId?: string;
    type?: string;
    content?: {
      fields?: Record<string, unknown>;
    };
  };
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

function blobUrl(blobIdOrUrl: string) {
  if (!blobIdOrUrl) return "";

  if (/^https?:\/\//.test(blobIdOrUrl)) {
    return blobIdOrUrl;
  }

  return `https://aggregator.walrus.space/v1/${blobIdOrUrl}`;
}

function blobIdFromFields(fields: Record<string, unknown>) {
  const imageUrl = stringValue(fields.image_url) || stringValue(fields.imageUrl);

  if (imageUrl) {
    const match = imageUrl.match(/\/v1\/(?:blobs\/)?([^/?#]+)/);
    return match?.[1] ?? imageUrl;
  }

  return (
    stringValue(fields.blob_id) ||
    stringValue(fields.blobId) ||
    stringValue(fields.media_blob_id) ||
    stringValue(fields.mediaBlobId) ||
    stringValue(fields.walrus_blob_id) ||
    stringValue(fields.walrusBlobId)
  );
}

function mapContentCreatedEvent(
  event: FeedEvent,
  objFields?: Record<string, unknown> | null,
  metadata?: Record<string, unknown> | null
): MediaContent | null {
  const eventFields = event.parsedJson || {};

  console.log("RAW EVENT:", JSON.stringify(event.parsedJson, null, 2));

  const fields = { ...eventFields, ...(objFields || {}) };
  const meta = metadata || {};

  const objectId =
    stringValue(fields.object_id) ||
    stringValue(fields.objectId) ||
    stringValue(fields.content_id) ||
    stringValue(fields.contentId) ||
    stringValue(fields.id);
  const mediaBlobId = blobIdFromFields(fields);
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

  if (!objectId || !creator) {
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
    description:
      stringValue(meta.description) ||
      stringValue(fields.description) ||
      "No description",
    creator: creator.slice(0, 10),
    creatorAddress: creator,
    createdAt: new Date(numberValue(timestamp)).toISOString(),
    imageUrl: mediaBlobId ? blobUrl(mediaBlobId) : null,
    aspect: "landscape",
    tags: stringArrayValue(meta.tags || fields.tags),
    moderationStatus: moderationStatusValue(
      meta.moderationStatus || fields.moderationStatus
    ),
    contentHash:
      stringValue(fields.content_hash) || stringValue(fields.contentHash),
    mediaBlobId,
    metadataBlobId,
    suiObjectId: objectId,
    mintTxId: event.id?.txDigest ?? "",
    safetyScore: numberValue(meta.safetyScore ?? fields.safetyScore)
  };
}

export default function FeedPage() {
  const suiClient = useSuiClient();
  const [items, setItems] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventType = useMemo(() => {
    return PACKAGE_ID ? `${PACKAGE_ID}::content::ContentMinted` : "";
  }, []);

  const loadFeed = useCallback(async () => {
    if (!eventType) {
      setItems([]);
      setError("NEXT_PUBLIC_PACKAGE_ID is required before loading feed events.");
      setLoading(false);
      return;
    }

    if (!suiClient) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response: { data: FeedEvent[] } | null = null;

      // Query ContentMinted (actual event type)
      try {
        const queryRes = await suiClient.queryEvents({
          query: {
            MoveEventType: eventType
          },
          limit: 50,
          order: "descending"
        });
        response = queryRes as { data: FeedEvent[] };
      } catch (err) {
        console.error("Failed to query ContentMinted events:", err);
      }

      // Fallback to ContentCreated if ContentMinted returned nothing
      if (!response || !response.data || response.data.length === 0) {
        try {
          const queryRes = await suiClient.queryEvents({
            query: {
              MoveEventType: `${PACKAGE_ID}::content::ContentCreated`
            },
            limit: 50,
            order: "descending"
          });
          response = queryRes as { data: FeedEvent[] };
        } catch (err) {
          console.error("Failed to query fallback ContentCreated events:", err);
        }
      }

      if (!response || !response.data || response.data.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Extract objectIds from events
      const objectIds: string[] = response.data
        .map((event: FeedEvent) => {
          const fields = event.parsedJson;
          if (!fields) return null;
          return (
            stringValue(fields.object_id) ||
            stringValue(fields.objectId) ||
            stringValue(fields.content_id) ||
            stringValue(fields.contentId) ||
            stringValue(fields.id)
          );
        })
        .filter((id: string | null): id is string => !!id);

      const uniqueObjectIds = Array.from(new Set(objectIds));

      // Fetch corresponding objects details
      let objectsResponse: SuiObjectResponse[] = [];
      if (uniqueObjectIds.length > 0) {
        const multiGetRes = await suiClient.multiGetObjects({
          ids: uniqueObjectIds,
          options: {
            showContent: true,
            showOwner: true,
            showType: true
          }
        });
        objectsResponse = multiGetRes as SuiObjectResponse[];
      }

      const objectsMap = new Map<string, NonNullable<SuiObjectResponse["data"]>>();
      for (const obj of objectsResponse) {
        if (obj.data && obj.data.objectId) {
          objectsMap.set(obj.data.objectId, obj.data);
        }
      }

      // Fetch metadata from Walrus in parallel
      const metadataPromises = uniqueObjectIds.map(async (objectId) => {
        const objData = objectsMap.get(objectId);
        const fields = objData?.content?.fields;
        if (!fields) return { objectId, metadata: {} };

        const metadataBlobId =
          stringValue(fields.metadata_blob_id) ||
          stringValue(fields.metadataBlobId) ||
          stringValue(fields.metadata_id) ||
          stringValue(fields.metadataId);

        if (!metadataBlobId) return { objectId, metadata: {} };

        try {
          const res = await fetch(
            `https://aggregator.walrus.space/v1/blobs/${metadataBlobId}`
          );
          if (res.ok) {
            const json = (await res.json()) as Record<string, unknown>;
            return { objectId, metadata: json };
          }
        } catch (err) {
          console.error("Failed to fetch metadata for object", objectId, err);
        }
        return { objectId, metadata: {} };
      });

      const metadataResults = await Promise.all(metadataPromises);
      const metadataMap = new Map<string, Record<string, unknown>>();
      for (const item of metadataResults) {
        metadataMap.set(item.objectId, item.metadata);
      }

      // Map events to MediaContent using fetched object fields and metadata
      const mapped = response.data
        .map((event: FeedEvent) => {
          const fields = event.parsedJson;
          if (!fields) return null;

          const objectId =
            stringValue(fields.object_id) ||
            stringValue(fields.objectId) ||
            stringValue(fields.content_id) ||
            stringValue(fields.contentId) ||
            stringValue(fields.id);

          if (!objectId) return null;

          const objData = objectsMap.get(objectId);
          const objFields = objData?.content?.fields || null;

          // If we couldn't fetch the object, map from event fields only (fallback)
          const metadata = metadataMap.get(objectId) || null;

          return mapContentCreatedEvent(event, objFields, metadata);
        })
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
  }, [eventType, suiClient]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

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
