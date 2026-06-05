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


async function uploadBlobWithRetry(blob: Blob, label: string) {
  let url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=3&deletable=true`;
  if (url.includes("publisher.walrus") && !url.includes("publisher.walrus-testnet")) {
    url = url
      .replace("publisher.walrus-mainnet.walrus.space", "publisher.walrus-testnet.walrus.space")
      .replace("publisher.walrus.space", "publisher.walrus-testnet.walrus.space");
  }
  let lastError: string | null = null;

  // Reduced attempts to 1 inside the Vercel API route to prevent 10s Serverless Function timeouts.
  // The client browser has its own retry loop and handles timeout/retry gracefully.
  for (let attempt = 1; attempt <= 1; attempt += 1) {
    try {
      console.log(`[Walrus Upload] [${label}] Upload starting. URL: ${url}`);
      
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const response = await fetch(url, {
        method: "PUT",
        body: buffer,
        headers: blob.type ? { "Content-Type": blob.type } : undefined
      });

      const text = await response.text();
      console.log(`[Walrus Upload] [${label}] Response status: ${response.status}`);
      console.log(`[Walrus Upload] [${label}] Response body: ${text.slice(0, 1000)}`);

      if (!response.ok) {
        lastError = `${label} upload failed with ${response.status}: ${text}`;
      } else {
        const parsed = JSON.parse(text) as WalrusPublisherResponse;
        const blobId = getBlobId(parsed);

        if (!blobId) {
          throw new Error(`${label} upload response did not include a blob ID.`);
        }

        console.log(`[Walrus Upload] [${label}] Success. Blob ID: ${blobId}`);
        return blobId;
      }
    } catch (caught: unknown) {
      lastError =
        caught instanceof Error
          ? caught.message
          : `${label} upload failed unexpectedly.`;
      console.error(`[Walrus Upload] [${label}] Exception:`, caught);
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
  console.log("[Walrus Upload] Starting upload flow.");
  try {
    const formData = await request.formData();
    const media = formData.get("media");
    const metadata = formData.get("metadata");

    if (!(media instanceof File)) {
      console.error("[Walrus Upload] Media file missing or invalid.");
      return NextResponse.json(
        { error: "Invalid file: A media file is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof metadata !== "string") {
      console.error("[Walrus Upload] Metadata JSON string is missing or invalid.");
      return NextResponse.json(
        { error: "Invalid file: Metadata JSON is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[Walrus Upload] File received: name="${media.name}", size=${media.size} bytes, type="${media.type}"`);
    console.log(`[Walrus Upload] Metadata received length: ${metadata.length} chars`);

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

    console.log("[Walrus Upload] Success uploading both media and metadata to Walrus:", result);
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (caught: unknown) {
    const errorMsg = caught instanceof Error ? caught.message : "Walrus upload failed unexpectedly.";
    console.error("[Walrus Upload] Upload flow failed:", caught);
    return NextResponse.json(
      {
        error: "Walrus upload failed",
        details: errorMsg
      },
      { status: 502, headers: corsHeaders }
    );
  }
}

