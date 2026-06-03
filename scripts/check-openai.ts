import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { analyzeImage } from "../lib/ai";
import { loadEnvLocal } from "./env";

loadEnvLocal();

const imagePath = process.argv[2];

function getMediaType(path: string) {
  const lower = path.toLowerCase();

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/png";
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local first.");
  }

  if (!imagePath) {
    throw new Error("Pass an image path: npx tsx scripts/check-openai.ts -- ./image.png");
  }

  const imageBase64 = readFileSync(imagePath).toString("base64");
  const result = await analyzeImage({
    imageBase64,
    mediaType: getMediaType(imagePath)
  });

  if (!result) {
    throw new Error(`OpenAI analysis unavailable for ${basename(imagePath)}.`);
  }

  console.log("OpenAI moderation response:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
