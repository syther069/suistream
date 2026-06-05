"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { PACKAGE_ID, WALRUS_AGGREGATOR_URL } from "@/lib/config";

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
      dataType?: string;
      fields?: Record<string, unknown>;
    };
  };
};

/* ── helpers ─────────────────────────────────────────────── */

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

/* ── retry wrapper for 429 rate limits ───────────────────── */

async function queryWithRetry(
  client: ReturnType<typeof useSuiClient>,
  params: { query: { MoveEventType: string }; limit: number; order: "descending" | "ascending" },
  retries = 3
): Promise<{ data: FeedEvent[] }> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await client.queryEvents(params);
      return res as { data: FeedEvent[] };
    } catch (e: unknown) {
      if (String(e).includes("429") && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  return { data: [] };
}

/* ── map on-chain object to MediaContent ─────────────────── */

function mapObjectToMediaContent(
  event: FeedEvent,
  objFields: Record<string, unknown>,
  objectId: string,
  metadata: Record<string, unknown>
): MediaContent {
  const meta = metadata || {};

  // mediaBlobId comes from the on-chain object fields
  const mediaBlobId =
    stringValue(objFields.media_blob_id) ||
    stringValue(objFields.mediaBlobId) ||
    stringValue(objFields.blob_id) ||
    stringValue(objFields.blobId) ||
    stringValue(objFields.image_blob_id) ||
    "";

  const imageUrl = mediaBlobId
    ? `${WALRUS_AGGREGATOR_URL}/${mediaBlobId}`
    : "";

  console.log("FEED ITEM fields:", JSON.stringify(objFields));
  console.log("mediaBlobId:", mediaBlobId);
  console.log("imageUrl:", imageUrl);

  const metadataBlobId =
    stringValue(objFields.metadata_blob_id) ||
    stringValue(objFields.metadataBlobId) ||
    "";

  const creator =
    stringValue(objFields.creator) ||
    stringValue(event.parsedJson?.creator) ||
    "";

  const title =
    stringValue(objFields.title) ||
    stringValue(objFields.name) ||
    stringValue(event.parsedJson?.title) ||
    "Untitled stream";

  const timestamp =
    stringValue(objFields.created_at) ||
    event.timestampMs ||
    String(Date.now());

  return {
    id: objectId,
    title,
    description:
      stringValue(meta.description) ||
      stringValue(objFields.description) ||
      "No description",
    creator: creator.slice(0, 10),
    creatorAddress: creator,
    createdAt: new Date(numberValue(timestamp)).toISOString(),
    imageUrl,
    aspect: "landscape",
    tags: stringArrayValue(meta.tags || objFields.tags),
    moderationStatus: moderationStatusValue(
      meta.moderationStatus || objFields.moderationStatus
    ),
    contentHash:
      stringValue(objFields.content_hash) ||
      stringValue(objFields.contentHash) ||
      "",
    mediaBlobId,
    metadataBlobId,
    suiObjectId: objectId,
    mintTxId: event.id?.txDigest ?? "",
    safetyScore: numberValue(meta.safetyScore ?? objFields.safetyScore ?? 0)
  };
}

/* ── page component ──────────────────────────────────────── */

export default function FeedPage() {
  const suiClient = useSuiClient();
  const [items, setItems] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

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
      /* ── Step 1: query events to get object IDs ──────── */
      let response: { data: FeedEvent[] } | null = null;

      // Try ContentMinted first
      try {
        response = await queryWithRetry(suiClient, {
          query: { MoveEventType: eventType },
          limit: 50,
          order: "descending"
        });
      } catch (err) {
        console.error("Failed to query ContentMinted events:", err);
      }

      // Fallback to ContentCreated
      if (!response || !response.data || response.data.length === 0) {
        try {
          response = await queryWithRetry(suiClient, {
            query: { MoveEventType: `${PACKAGE_ID}::content::ContentCreated` },
            limit: 50,
            order: "descending"
          });
        } catch (err) {
          console.error("Failed to query fallback ContentCreated events:", err);
        }
      }

      if (!response || !response.data || response.data.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      console.log("Got", response.data.length, "events");

      // Extract object IDs from events
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
      console.log("Unique object IDs:", uniqueObjectIds.length);

      /* ── Step 2: fetch actual object fields ──────────── */
      let objectsResponse: SuiObjectResponse[] = [];
      if (uniqueObjectIds.length > 0) {
        const multiGetRes = await suiClient.multiGetObjects({
          ids: uniqueObjectIds,
          options: {
            showContent: true,
            showDisplay: true
          }
        });
        objectsResponse = multiGetRes as SuiObjectResponse[];
      }

      // Build objectId → fields map
      const objectsMap = new Map<string, { fields: Record<string, unknown>; objectId: string }>();
      for (const obj of objectsResponse) {
        if (obj.data?.objectId && obj.data?.content?.fields) {
          objectsMap.set(obj.data.objectId, {
            fields: obj.data.content.fields,
            objectId: obj.data.objectId
          });
        }
      }

      console.log("Fetched objects with fields:", objectsMap.size);

      /* ── Step 3: fetch metadata from Walrus ──────────── */
      const metadataMap = new Map<string, Record<string, unknown>>();

      const metadataPromises = Array.from(objectsMap.entries()).map(
        async ([objectId, { fields }]) => {
          const metadataBlobId =
            stringValue(fields.metadata_blob_id) ||
            stringValue(fields.metadataBlobId) ||
            "";

          if (!metadataBlobId) return;

          try {
            const res = await fetch(
              `/walrus-proxy/v1/blobs/${metadataBlobId}`
            );
            if (res.ok) {
              const json = (await res.json()) as Record<string, unknown>;
              metadataMap.set(objectId, json);
            }
          } catch (err) {
            console.error("Failed to fetch metadata for", objectId, err);
          }
        }
      );

      await Promise.all(metadataPromises);

      /* ── Step 4: build MediaContent from object fields ── */
      const mapped = response.data
        .map((event: FeedEvent) => {
          const eventFields = event.parsedJson;
          if (!eventFields) return null;

          const objectId =
            stringValue(eventFields.object_id) ||
            stringValue(eventFields.objectId) ||
            stringValue(eventFields.content_id) ||
            stringValue(eventFields.contentId) ||
            stringValue(eventFields.id);

          if (!objectId) return null;

          const objEntry = objectsMap.get(objectId);
          if (!objEntry) {
            console.warn("No object data for", objectId);
            return null;
          }

          const metadata = metadataMap.get(objectId) || {};

          return mapObjectToMediaContent(
            event,
            objEntry.fields,
            objectId,
            metadata
          );
        })
        .filter((item: MediaContent | null): item is MediaContent => item !== null && item.moderationStatus === "approved");

      console.log("Mapped feed items:", mapped.length);
      if (mapped.length > 0) {
        console.log("First item:", JSON.stringify(mapped[0], null, 2));
      }

      setItems(mapped);
    } catch (caught) {
      console.error("loadFeed error:", caught);
      setItems([]);
      setError(
        caught instanceof Error ? caught.message : "Unable to load feed events."
      );
    } finally {
      setLoading(false);
    }
  }, [eventType, suiClient]);

  // Prevent duplicate calls with useRef
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void loadFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Button onClick={() => { hasFetched.current = false; void loadFeed(); }} variant="outline">
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
