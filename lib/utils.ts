import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, prefix = 6, suffix = 4) {
  if (address.length <= prefix + suffix) {
    return address;
  }

  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export function formatSui(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export async function sha256Hex(file: File | Blob | string) {
  const data =
    typeof file === "string"
      ? new TextEncoder().encode(file)
      : new Uint8Array(await file.arrayBuffer());
  const hash = await crypto.subtle.digest("SHA-256", data);

  return `0x${Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}
