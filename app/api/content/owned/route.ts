import { NextRequest, NextResponse } from "next/server";
import { getOwnedContent } from "@/lib/sui-data";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json({ items: await getOwnedContent(address) });
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error ? caught.message : "Unable to load content."
      },
      { status: 500 }
    );
  }
}
