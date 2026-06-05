import { WALRUS_AGGREGATOR_URL, WALRUS_PUBLISHER_URL } from "@/lib/config";
import type { UploadedContentMetadata, WalrusUploadResult } from "@/lib/types";

type WalrusPublisherResponse = {
  newlyCreated?: {
    blobObject?: {
      blobId?: string;
      id?: string;
    };
  };
  alreadyCertified?: {
    blobId?: string;
  };
  blobId?: string;
  id?: string;
};

function getBlobId(result: WalrusPublisherResponse): string | null {
  return (
    result.newlyCreated?.blobObject?.blobId ??
    result.newlyCreated?.blobObject?.id ??
    result.alreadyCertified?.blobId ??
    result.blobId ??
    result.id ??
    null
  );
}

async function delay(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function uploadDirectToWalrus(blob: Blob, label: string): Promise<string> {
  let url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=3&deletable=true`;
  if (url.includes("publisher.walrus") && !url.includes("publisher.walrus-testnet")) {
    url = url
      .replace("publisher.walrus-mainnet.walrus.space", "publisher.walrus-testnet.walrus.space")
      .replace("publisher.walrus.space", "publisher.walrus-testnet.walrus.space");
  }

  const response = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: blob.type ? { "Content-Type": blob.type } : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} upload failed with status ${response.status}: ${text}`);
  }

  const result = (await response.json()) as WalrusPublisherResponse;
  const blobId = getBlobId(result);
  if (!blobId) {
    throw new Error(`${label} upload response did not include a blob ID.`);
  }

  return blobId;
}

export async function uploadMediaAndMetadata(input: {
  media: File;
  metadata: UploadedContentMetadata;
}): Promise<WalrusUploadResult> {
  const metadataString = JSON.stringify(input.metadata, null, 2);
  const metadataBlob = new Blob([metadataString], { type: "application/json" });

  // 1. Try uploading directly from the client first to bypass Vercel timeout/limit
  try {
    console.log("[Walrus Client Upload] Attempting direct upload to publisher...");
    const [mediaBlobId, metadataBlobId] = await Promise.all([
      uploadDirectToWalrus(input.media, "Media"),
      uploadDirectToWalrus(metadataBlob, "Metadata")
    ]);

    console.log("[Walrus Client Upload] Direct upload succeeded:", { mediaBlobId, metadataBlobId });
    return {
      mediaBlobId,
      metadataBlobId,
      mediaSizeBytes: input.media.size,
      metadataSizeBytes: metadataBlob.size
    };
  } catch (caught) {
    console.warn("[Walrus Client Upload] Direct upload failed, falling back to API proxy route. Error:", caught);
  }

  // 2. Fallback to API proxy route if direct upload failed
  const formData = new FormData();
  formData.set("media", input.media);
  formData.set("metadata", metadataString);

  let lastError = "Walrus upload failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch("/api/walrus/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as
        | WalrusUploadResult
        | { error?: string; details?: string };

      if (response.ok && "mediaBlobId" in payload) {
        return payload as WalrusUploadResult;
      }

      lastError =
        "error" in payload && payload.error
          ? (payload.details ? `${payload.error}: ${payload.details}` : payload.error)
          : `Walrus upload failed with status ${response.status}.`;
    } catch (caught) {
      lastError =
        caught instanceof Error ? caught.message : "Walrus upload failed.";
    }

    if (attempt < 3) {
      await delay(600 * attempt);
    }
  }

  throw new Error(lastError);
}

export function getBlobUrl(blobId: string) {
  return `${WALRUS_AGGREGATOR_URL}/${blobId}`;
}

export async function getBlob(blobId: string) {
  return {
    blobId,
    url: getBlobUrl(blobId)
  };
}

