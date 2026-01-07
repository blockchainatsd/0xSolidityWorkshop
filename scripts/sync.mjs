#!/usr/bin/env node
/**
 * sync.mjs
 *
 * Copies the TipWall ABI and deployed address from Foundry output
 * into the frontend project.
 *
 * Usage: node scripts/sync.mjs
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Paths
const CONTRACTS_OUT = join(
  ROOT,
  "contracts",
  "out",
  "TipWall.sol",
  "TipWall.json"
);
const BROADCAST_DIR = join(
  ROOT,
  "contracts",
  "broadcast",
  "Deploy.s.sol",
  "31337"
);
const FRONTEND_ABI_DIR = join(ROOT, "frontend", "src", "abi");
const FRONTEND_ABI_FILE = join(FRONTEND_ABI_DIR, "TipWall.json");
const FRONTEND_ENV_FILE = join(ROOT, "frontend", ".env.local");

function findLatestBroadcast() {
  const runLatest = join(BROADCAST_DIR, "run-latest.json");
  if (existsSync(runLatest)) {
    return runLatest;
  }

  // Fallback: look for any run-*.json files
  if (existsSync(BROADCAST_DIR)) {
    const files = readdirSync(BROADCAST_DIR).filter(
      (f) => f.startsWith("run-") && f.endsWith(".json")
    );
    if (files.length > 0) {
      return join(BROADCAST_DIR, files[files.length - 1]);
    }
  }

  return null;
}

function main() {
  console.log("🔄 Syncing contract artifacts to frontend...\n");

  // 1. Copy ABI
  if (!existsSync(CONTRACTS_OUT)) {
    console.error("❌ ABI not found at:", CONTRACTS_OUT);
    console.error("   Run `forge build` in the contracts directory first.");
    process.exit(1);
  }

  const contractJson = JSON.parse(readFileSync(CONTRACTS_OUT, "utf8"));
  const abi = contractJson.abi;

  // Create ABI directory if needed
  if (!existsSync(FRONTEND_ABI_DIR)) {
    mkdirSync(FRONTEND_ABI_DIR, { recursive: true });
  }

  writeFileSync(FRONTEND_ABI_FILE, JSON.stringify(abi, null, 2));
  console.log("✅ ABI copied to:", FRONTEND_ABI_FILE);

  // 2. Extract deployed address from broadcast
  const broadcastPath = findLatestBroadcast();
  if (!broadcastPath) {
    console.error("❌ Broadcast file not found in:", BROADCAST_DIR);
    console.error("   Deploy with `forge script ... --broadcast` first.");
    process.exit(1);
  }

  const broadcast = JSON.parse(readFileSync(broadcastPath, "utf8"));

  // Find the CREATE transaction for TipWall
  const createTx = broadcast.transactions?.find(
    (tx) => tx.transactionType === "CREATE" && tx.contractName === "TipWall"
  );

  if (!createTx) {
    console.error("❌ Could not find TipWall deployment in broadcast file.");
    process.exit(1);
  }

  const contractAddress = createTx.contractAddress;

  // Write .env.local
  const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
  writeFileSync(FRONTEND_ENV_FILE, envContent);
  console.log("✅ Contract address written to:", FRONTEND_ENV_FILE);
  console.log("   Address:", contractAddress);

  console.log("\n🎉 Sync complete! Frontend is ready.");
}

main();
