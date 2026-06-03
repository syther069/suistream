import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ai";

export async function POST(request: NextRequest) {
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
    let errorType = "OpenAI request failed";

    const errStatus = error && typeof error === "object" && "status" in error
      ? (error as { status: number }).status
      : undefined;

    if (errorMessage.includes("OpenAI API key missing")) {
      status = 500;
      errorType = "OpenAI API key missing";
    } else if (errStatus === 429 || errorMessage.includes("quota") || errorMessage.includes("429")) {
      status = 429;
      errorType = "OpenAI quota exceeded";
    } else if (errStatus === 401 || errorMessage.includes("incorrect api key")) {
      status = 401;
      errorType = "OpenAI authentication failed";
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

