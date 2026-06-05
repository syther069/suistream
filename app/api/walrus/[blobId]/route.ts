import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blobId: string }> }
) {
  const { blobId } = await params
  const aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space";
  let response = await fetch(
    `${aggregatorUrl}/v1/blobs/${blobId}`
  )
  if (!response.ok) {
    const fallbackUrl = aggregatorUrl.includes("mainnet")
      ? "https://aggregator.walrus-testnet.walrus.space"
      : "https://aggregator.walrus-mainnet.walrus.space";
    response = await fetch(
      `${fallbackUrl}/v1/blobs/${blobId}`
    )
  }
  if (!response.ok) {
    return new NextResponse("Not found", { status: 404 })
  }
  const buffer = await response.arrayBuffer()
  let contentType = response.headers.get("content-type")
  if (!contentType) {
    try {
      const text = new TextDecoder().decode(buffer)
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        contentType = "application/json"
      } else {
        contentType = "image/jpeg"
      }
    } catch {
      contentType = "image/jpeg"
    }
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*"
    }
  })
}