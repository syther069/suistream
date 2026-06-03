import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function loadEnvLocal() {
  const currentDir = typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(currentDir, "../.env.local");

  if (!existsSync(envPath)) {
    return;
  }

  dotenv.config({ path: envPath });
}
