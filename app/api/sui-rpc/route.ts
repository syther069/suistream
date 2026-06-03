import { NextRequest, NextResponse } from "next/server";
import { TATUM_SUI_RPC_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  if (!process.env.TATUM_API_KEY) {
    return NextResponse.json(
      {
        error:
          "TATUM_API_KEY is missing. Add it to .env.local before using mainnet RPC."
      },
      { status: 500 }
    );
  }

  const body = await request.text();
  const response = await fetch(TATUM_SUI_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.TATUM_API_KEY
    },
    body
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json"
    }
  });
}

export function GET() {
  return NextResponse.json(
    { error: "Use POST for Sui JSON-RPC requests." },
    { status: 405 }
  );
}
