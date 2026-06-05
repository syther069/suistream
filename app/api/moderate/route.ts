export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ai";

export async function POST(request: NextRequest) {
  console.log("[Moderate Route] Request received");
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Invalid file: An image file is required." },
        { status: 400 }
      );
    }

    const title = formData.get("title");
    const description = formData.get("description");

    const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const analysis = await analyzeImage({
      imageBase64,
      mediaType: image.type || "image/png",
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : undefined
    });

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "AI analysis failed unexpectedly.";
    console.error("[Moderate Route Error]:", error);

    // Determine appropriate status code and message
    let status = 502; // Bad Gateway for third-party API issues
    let errorType = "AI request failed";

    const errStatus = error && typeof error === "object" && "status" in error
      ? (error as { status: unknown }).status
      : undefined;
    const errStatusCode = error && typeof error === "object" && "statusCode" in error
      ? (error as { statusCode: unknown }).statusCode
      : undefined;
    const errCode = error && typeof error === "object" && "code" in error
      ? (error as { code: unknown }).code
      : undefined;

    const isMissingKey =
      errorMessage.includes("OpenAI API key missing") ||
      errorMessage.includes("Neither GROQ_API_KEY nor OPENAI_API_KEY is configured") ||
      errorMessage.includes("API key detected: false");

    const is429 =
      errStatus === 429 ||
      errStatusCode === 429 ||
      errCode === "rate_limit_exceeded" ||
      errCode === "insufficient_quota" ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("429") ||
      errorMessage.toLowerCase().includes("rate limit") ||
      errorMessage.toLowerCase().includes("too many requests");

    const is401 =
      errStatus === 401 ||
      errStatusCode === 401 ||
      errCode === "invalid_api_key" ||
      errorMessage.toLowerCase().includes("incorrect api key") ||
      errorMessage.toLowerCase().includes("authentication") ||
      errorMessage.toLowerCase().includes("401");

    if (isMissingKey) {
      status = 500;
      errorType = "AI API key missing";
    } else if (is429) {
      status = 429;
      errorType = "AI quota exceeded";
    } else if (is401) {
      status = 401;
      errorType = "AI authentication failed";
    }

    return NextResponse.json(
      {
        error: errorType,
        details: errorMessage
      },
      { status }
    );
  }
}

