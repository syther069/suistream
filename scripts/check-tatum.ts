import { getCheckpoint, getOwnedContent, getSuiBalance } from "../lib/tatum";
import { loadEnvLocal } from "./env";

loadEnvLocal();

const address = process.argv[2];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!process.env.TATUM_API_KEY) {
    throw new Error("TATUM_API_KEY is missing. Add it to .env.local first.");
  }
  if (!address) {
    throw new Error("Pass a real Sui mainnet address: npm run check:tatum -- 0x...");
  }

  console.log(`Checking Tatum Sui RPC for ${address}`);

  const balance = await getSuiBalance(address);
  console.log("SUI balance response:");
  console.log(JSON.stringify(balance, null, 2));

  await sleep(1000);

  const ownedObjects = await getOwnedContent(address);
  console.log("Owned objects response:");
  console.log(JSON.stringify(ownedObjects, null, 2).slice(0, 1200));

  await sleep(1000);

  const checkpoint = await getCheckpoint("latest");
  console.log("Latest checkpoint response:");
  console.log(JSON.stringify(checkpoint, null, 2).slice(0, 1200));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
