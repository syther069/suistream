import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blobId: string }> }
) {
  const { blobId } = await params
  const response = await fetch(
    `https://aggregator.walrus.space/v1/blobs/${blobId}`
  )
  if (!response.ok) {
    return new NextResponse("Not found", { status: 404 })
  }
  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get("content-type") || "image/jpeg"
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*"
    }
  })
}