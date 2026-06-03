import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const packagePath = resolve(process.env.SUI_PACKAGE_PATH ?? "contracts/suistream");

if (!existsSync(packagePath)) {
  throw new Error(`Move package not found at ${packagePath}`);
}

const args = [
  "client",
  "publish",
  packagePath,
  "--gas-budget",
  process.env.SUI_GAS_BUDGET ?? "50000000"
];

console.log(`Publishing SuiStream package from ${packagePath}`);
execFileSync("sui", args, {
  stdio: "inherit"
});

console.log("Publish complete. Copy the package ID into NEXT_PUBLIC_PACKAGE_ID.");
