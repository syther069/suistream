import {
  PACKAGE_ID,
  TATUM_SUI_RPC_URL,
  WALRUS_AGGREGATOR_URL
} from "@/lib/config";
import type {
  DashboardData,
  ModerationStatus,
  OwnedContent,
  RevenuePoint,
  TipEvent
} from "@/lib/types";

type RpcSuccess<T> = {
  result: T;
};

type RpcFailure = {
  error: {
    message?: string;
  };
};

type OwnedObjectsResult = {
  data?: SuiObjectResponse[];
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

type QueryEventsResult = {
  data?: SuiEventResponse[];
};

type SuiEventResponse = {
  id?: {
    txDigest?: string;
  };
  timestampMs?: string;
  parsedJson?: Record<string, unknown>;
};

type MetadataJson = {
  tags?: string[];
  moderationStatus?: ModerationStatus;
  safetyScore?: number;
  mediaSizeBytes?: number;
  metadataSizeBytes?: number;
  description?: string;
};

const STORAGE_QUOTA_BYTES = 200 * 1024 * 1024 * 1024;

function getTatumApiKey() {
  if (!process.env.TATUM_API_KEY) {
    throw new Error("TATUM_API_KEY is required for Sui mainnet RPC.");
  }

  return process.env.TATUM_API_KEY;
}

async function suiRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(TATUM_SUI_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getTatumApiKey()
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    })
  });

  const payload = (await response.json()) as RpcSuccess<T> | RpcFailure;

  if (!response.ok || "error" in payload) {
    const message =
      "error" in payload
        ? payload.error.message ?? `${method} failed.`
        : `${method} failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload.result;
}

function stringField(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  return typeof value === "string" ? value : "";
}

function numberField(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isModerationStatus(value: unknown): value is ModerationStatus {
  return value === "approved" || value === "flagged";
}

async function fetchMetadata(metadataBlobId: string): Promise<MetadataJson> {
  if (!metadataBlobId) {
    return {};
  }

  try {
    const response = await fetch(
      `${WALRUS_AGGREGATOR_URL}/v1/blobs/${metadataBlobId}`
    );
    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const tags = Array.isArray(payload.tags)
      ? payload.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined;

    return {
      tags,
      moderationStatus: isModerationStatus(payload.moderationStatus)
        ? payload.moderationStatus
        : undefined,
      safetyScore:
        typeof payload.safetyScore === "number" ? payload.safetyScore : undefined,
      mediaSizeBytes:
        typeof payload.mediaSizeBytes === "number"
          ? payload.mediaSizeBytes
          : undefined,
      metadataSizeBytes:
        typeof payload.metadataSizeBytes === "number"
          ? payload.metadataSizeBytes
          : undefined,
      description:
        typeof payload.description === "string" ? payload.description : undefined
    };
  } catch {
    return {};
  }
}

async function getBlobContentLength(blobId: string) {
  if (!blobId) {
    return 0;
  }

  try {
    const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`, {
      method: "HEAD"
    });
    const value = response.headers.get("Content-Length");
    return value ? Number(value) : 0;
  } catch {
    return 0;
  }
}

async function toOwnedContent(object: SuiObjectResponse): Promise<OwnedContent | null> {
  const objectId = object.data?.objectId;
  const fields = object.data?.content?.fields;

  if (!objectId || !fields) {
    return null;
  }

  const mediaBlobId = stringField(fields, "media_blob_id");
  const metadataBlobId = stringField(fields, "metadata_blob_id");
  const metadata = await fetchMetadata(metadataBlobId);
  const mediaSizeBytes =
    metadata.mediaSizeBytes ?? (await getBlobContentLength(mediaBlobId));
  const metadataSizeBytes =
    metadata.metadataSizeBytes ?? (await getBlobContentLength(metadataBlobId));

  return {
    id: objectId,
    title: stringField(fields, "title"),
    description:
      metadata.description || stringField(fields, "description") || "No description",
    creatorAddress: stringField(fields, "creator"),
    createdAt: new Date(numberField(fields, "created_at")).toISOString(),
    imageUrl: `https://aggregator.walrus.space/v1/blobs/${mediaBlobId}`,
    tags: metadata.tags ?? [],
    moderationStatus: metadata.moderationStatus ?? "approved",
    contentHash: stringField(fields, "content_hash"),
    mediaBlobId,
    metadataBlobId,
    suiObjectId: objectId,
    safetyScore: metadata.safetyScore ?? 0,
    storageBytes: mediaSizeBytes + metadataSizeBytes
  };
}

export async function getOwnedContent(address: string) {
  if (!PACKAGE_ID) {
    return [];
  }

  const result = await suiRpc<OwnedObjectsResult>("suix_getOwnedObjects", [
    address,
    {
      filter: {
        StructType: `${PACKAGE_ID}::content::ContentNFT`
      },
      options: {
        showContent: true,
        showOwner: true,
        showType: true
      }
    },
    null,
    50
  ]);

  const parsed = await Promise.all(
    (result.data ?? []).map((object) => toOwnedContent(object))
  );

  return parsed.filter((content): content is OwnedContent => content !== null);
}

export async function getTipEventsForCreator(address: string) {
  if (!PACKAGE_ID) {
    return [];
  }

  const result = await suiRpc<QueryEventsResult>("suix_queryEvents", [
    {
      MoveEventType: `${PACKAGE_ID}::content::ContentTipped`
    },
    null,
    100,
    true
  ]);

  return (result.data ?? [])
    .filter((event) => event.parsedJson?.creator === address)
    .map((event): TipEvent => {
      const amount = event.parsedJson?.amount;
      return {
        digest: event.id?.txDigest ?? "",
        amountMist: typeof amount === "string" ? amount : String(amount ?? "0"),
        timestampMs: event.timestampMs ?? null
      };
    })
    .filter((event) => event.digest);
}

function buildRevenue(tips: TipEvent[]): RevenuePoint[] {
  const now = new Date();
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return {
      date,
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      amountMist: BigInt(0)
    };
  });

  for (const tip of tips) {
    if (!tip.timestampMs) {
      continue;
    }

    const timestamp = Number(tip.timestampMs);
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const tipDate = new Date(timestamp);
    const match = points.find(
      (point) =>
        point.date.getFullYear() === tipDate.getFullYear() &&
        point.date.getMonth() === tipDate.getMonth() &&
        point.date.getDate() === tipDate.getDate()
    );

    if (match) {
      match.amountMist += BigInt(tip.amountMist);
    }
  }

  return points.map((point) => ({
    label: point.label,
    amountMist: point.amountMist.toString()
  }));
}

export async function getDashboardData(address: string): Promise<DashboardData> {
  const [ownedContent, recentTips] = await Promise.all([
    getOwnedContent(address),
    getTipEventsForCreator(address)
  ]);
  const totalEarningsMist = recentTips
    .reduce((total, tip) => total + BigInt(tip.amountMist), BigInt(0))
    .toString();
  const storageUsedBytes = ownedContent.reduce(
    (total, content) => total + content.storageBytes,
    0
  );
  const storagePercent =
    storageUsedBytes > 0
      ? Math.min(100, (storageUsedBytes / STORAGE_QUOTA_BYTES) * 100)
      : 0;

  return {
    totalEarningsMist,
    storageUsedBytes,
    storageQuotaBytes: STORAGE_QUOTA_BYTES,
    storagePercent,
    revenue: buildRevenue(recentTips),
    recentTips,
    ownedContent
  };
}
