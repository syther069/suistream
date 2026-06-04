import Groq from "groq-sdk";
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

4. **moderationStatus**:

Return "approved" for:
- anime artwork
- illustrations
- gaming content
- memes
- fantasy characters
- smoking or cigarettes
- celebrities
- products
- vehicles
- landscapes
- normal social media content

Return "flagged" ONLY for:
- nudity or pornography
- graphic violence or gore
- self-harm
- hate symbols
- child exploitation
- illegal dangerous activities${contextBlock}

Return ONLY raw JSON, no markdown, no backticks:
{ "tags": string[], "description": string, "safetyScore": number, "moderationStatus": "approved" | "flagged" }`;
}

export async function analyzeImage(input: {
  imageBase64: string;
  mediaType: string;
  title?: string;
  description?: string;
}): Promise<AiAnalysis> {
 const groqApiKey = process.env.GROQ_API_KEY;
console.log(`[AI] API key detected: ${!!groqApiKey}`);

if (!groqApiKey) {
  const errorMsg = "GROQ_API_KEY missing";
  console.error(`[AI] ${errorMsg}`);
  throw new Error(errorMsg);
}

const model = "meta-llama/llama-4-scout-17b-16e-instruct";
console.log(`[AI] Model being used: ${model}`);

const groq = new Groq({
  apiKey: groqApiKey,
});

  try {
       console.log("[AI] About to call Groq");
    const response = await groq.chat.completions.create({
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

   console.log("[AI] Groq response received successfully");

const messageContent = response.choices?.[0]?.message?.content;

console.log("[AI] Raw Response:");
console.log(messageContent);

if (!messageContent) {
  const errorMsg = "Groq returned an empty response content.";
  console.error(`[AI] ${errorMsg}`);
  throw new Error(errorMsg);
}

const raw = JSON.parse(extractJson(messageContent));

console.log("[AI] Parsed JSON:");
console.log(raw);

const parsed = toAiAnalysis(raw);

if (!parsed) {
  console.error("[AI] Failed to map response.");
  console.error("[AI] Raw object:", raw);

  throw new Error(
    "Failed to map Groq response to structured AI analysis format."
  );
}

console.log("[AI] Final Parsed Analysis:");
console.log(parsed);

return parsed;
  } catch (error: unknown) {
    console.error("[AI] Request failure");
    const errStatus = error && typeof error === "object" && "status" in error
      ? (error as { status: unknown }).status
      : undefined;
    const errMessage = error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

    console.error(`[AI] Error details: Status ${errStatus || "unknown"}, Message: ${errMessage}`);
    throw error;
  }
}

