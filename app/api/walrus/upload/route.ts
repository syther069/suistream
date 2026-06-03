import { NextRequest, NextResponse } from "next/server";
import { WALRUS_PUBLISHER_URL } from "@/lib/config";
import type { WalrusUploadResult } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

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

function getBlobId(result: WalrusPublisherResponse) {
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

async function uploadBlobWithRetry(blob: Blob, label: string) {
  const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=3&deletable=true`;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: blob,
        headers: blob.type ? { "Content-Type": blob.type } : undefined
      });

      const text = await response.text();
      if (!response.ok) {
        lastError = `${label} upload failed with ${response.status}: ${text}`;
      } else {
        const parsed = JSON.parse(text) as WalrusPublisherResponse;
        const blobId = getBlobId(parsed);

        if (!blobId) {
          throw new Error(`${label} upload response did not include a blob ID.`);
        }

        return blobId;
      }
    } catch (caught) {
      lastError =
        caught instanceof Error
          ? caught.message
          : `${label} upload failed unexpectedly.`;
    }

    if (attempt < 3) {
      await delay(500 * attempt);
    }
  }

  throw new Error(lastError ?? `${label} upload failed.`);
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const media = formData.get("media");
    const metadata = formData.get("metadata");

    if (!(media instanceof File)) {
      return NextResponse.json(
        { error: "A media file is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof metadata !== "string") {
      return NextResponse.json(
        { error: "Metadata JSON is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const metadataBlob = new Blob([metadata], { type: "application/json" });
    const [mediaBlobId, metadataBlobId] = await Promise.all([
      uploadBlobWithRetry(media, "Media"),
      uploadBlobWithRetry(metadataBlob, "Metadata")
    ]);

    const result: WalrusUploadResult = {
      mediaBlobId,
      metadataBlobId,
      mediaSizeBytes: media.size,
      metadataSizeBytes: metadataBlob.size
    };

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "Walrus upload failed unexpectedly."
      },
      { status: 502, headers: corsHeaders }
    );
  }
}
