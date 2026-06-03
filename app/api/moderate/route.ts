import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "An image file is required." },
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

    if (!analysis) {
      return NextResponse.json(
        { error: "AI analysis temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "AI analysis temporarily unavailable" },
      { status: 503 }
    );
  }
}
