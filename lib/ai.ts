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
}): Promise<AiAnalysis | null> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error("OPENAI_API_KEY is not configured.");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o",
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
      })
    });

    if (!response.ok) {
      console.error(
        `OpenAI API returned status ${response.status}:`,
        await response.text()
      );
      return null;
    }

    const payload = await response.json();
    const messageContent = payload.choices?.[0]?.message?.content;

    if (!messageContent) {
      return null;
    }

    return toAiAnalysis(JSON.parse(extractJson(messageContent)));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("OpenAI API request timed out after 30 seconds.");
    } else {
      console.error("Failed to parse OpenAI moderation response:", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
