import OpenAI from "openai";
import type { AiAnalysis, ModerationStatus } from "@/lib/types";

function isModerationStatus(value: unknown): value is ModerationStatus {
  return value === "approved" || value === "flagged";
}

function toAiAnalysis(value: unknown): AiAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const description =
    typeof record.description === "string" ? record.description : "";

  let safetyScore: number | null = null;
  if (typeof record.safetyScore === "number") {
    safetyScore = record.safetyScore;
  } else if (typeof record.safetyScore === "string") {
    const parsed = parseFloat(record.safetyScore);
    if (!isNaN(parsed)) {
      safetyScore = parsed;
    }
  }

  const moderationStatus = isModerationStatus(record.moderationStatus)
    ? record.moderationStatus
    : null;

  if (!description || safetyScore === null || !moderationStatus) {
    return null;
  }

  return {
    tags: tags.slice(0, 8),
    description,
    safetyScore: Math.max(0, Math.min(1, safetyScore)),
    moderationStatus
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function buildPrompt(input: {
  title?: string;
  description?: string;
}): string {
  const contextParts: string[] = [];

  if (input.title) {
    contextParts.push(`Title: "${input.title}"`);
  }

  if (input.description) {
    contextParts.push(`Description: "${input.description}"`);
  }

  const contextBlock =
    contextParts.length > 0
      ? `\n\nThe user also provided:\n${contextParts.join("\n")}\n\nInclude the title and description in your moderation assessment.`
      : "";

  return `Analyze this image carefully. Look at the actual visual content and provide:

1. **tags**: 5 to 8 specific, descriptive tags based on what you see in the image. Be precise — use tags like "golden retriever", "beach", "sunset", "ocean waves" instead of generic tags like "image", "photo", "content".

2. **description**: A single clear sentence describing what the image shows. Be specific about subjects, actions, setting, and mood.

3. **safetyScore**: A number between 0 and 1 representing content safety. 1.0 = completely safe. 0.0 = clearly unsafe. Consider NSFW content, violence, hate symbols, harmful content, and graphic material.

4. **moderationStatus**: "approved" if the image is safe for a public content platform. "flagged" if it contains NSFW, violence, hate, or harmful content.${contextBlock}

Return ONLY raw JSON, no markdown, no backticks:
{ "tags": string[], "description": string, "safetyScore": number, "moderationStatus": "approved" | "flagged" }`;
}

export async function analyzeImage(input: {
  imageBase64: string;
  mediaType: string;
  title?: string;
  description?: string;
}): Promise<AiAnalysis> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  console.log(`[AI] API key detected: ${!!openaiApiKey}`);

  if (!openaiApiKey) {
    const errorMsg = "OpenAI API key missing";
    console.error(`[AI] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const model = "gpt-4o";
  console.log(`[AI] Model being used: ${model}`);

  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    const response = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPrompt({
                title: input.title,
                description: input.description
              })
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.mediaType};base64,${input.imageBase64}`
              }
            }
          ]
        }
      ]
    }, {
      timeout: 30_000
    });

    console.log("[AI] Request success");
    const messageContent = response.choices?.[0]?.message?.content;

    if (!messageContent) {
      const errorMsg = "OpenAI returned an empty response content.";
      console.error(`[AI] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const parsed = toAiAnalysis(JSON.parse(extractJson(messageContent)));
    if (!parsed) {
      const errorMsg = "Failed to map OpenAI response to structured AI analysis format.";
      console.error(`[AI] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return parsed;
  } catch (error: unknown) {
    console.error("[AI] Request failure");
    const errStatus = error && typeof error === "object" && "status" in error
      ? (error as { status: number }).status
      : undefined;
    const errMessage = error && typeof error === "object" && "message" in error
      ? (error as { message: string }).message
      : undefined;

    if (errStatus) {
      console.error(`[AI] OpenAI API error response: Status ${errStatus}`);
    }
    if (errMessage) {
      console.error(`[AI] OpenAI error message: ${errMessage}`);
    } else {
      console.error("[AI] OpenAI error detail:", error);
    }
    throw error;
  }
}

