import { WALRUS_AGGREGATOR_URL } from "@/lib/config";
import type { UploadedContentMetadata, WalrusUploadResult } from "@/lib/types";

async function delay(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function uploadMediaAndMetadata(input: {
  media: File;
  metadata: UploadedContentMetadata;
}): Promise<WalrusUploadResult> {
  const formData = new FormData();
  formData.set("media", input.media);
  formData.set("metadata", JSON.stringify(input.metadata, null, 2));

  let lastError = "Walrus upload failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch("/api/walrus/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as
        | WalrusUploadResult
        | { error?: string };

      if (response.ok && "mediaBlobId" in payload) {
        return payload;
      }

      lastError =
        "error" in payload && payload.error
          ? payload.error
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
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}

export async function getBlob(blobId: string) {
  return {
    blobId,
    url: getBlobUrl(blobId)
  };
}
