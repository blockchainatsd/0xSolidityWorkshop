/**
 * Example: Reading contract state with viem
 * 
 * This file demonstrates how to use viem to read data from the TipWall contract.
 * 
 * NOTE: This requires the ABI to be synced first by running `node scripts/sync.mjs`
 */

import { publicClient } from '../viem';
import tipWallAbi from '../abi/TipWall.json';

// Get contract address from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

// Tip type matching the contract struct
// Note: timestamp is bigint because Solidity uint40 is returned as bigint by viem
interface Tip {
  from: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
  message: string;
}

/**
 * Read the total amount of ETH tipped to the contract
 */
export async function getTotalTipped(): Promise<bigint> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Run sync.mjs first.');
  }
  if (!tipWallAbi || (Array.isArray(tipWallAbi) && tipWallAbi.length === 0)) {
    throw new Error('ABI not loaded. Run sync.mjs first.');
  }
  
  const total = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'totalTipped',
  });
  return total as bigint;
}

/**
 * Read the number of tips stored in the contract
 */
export async function getTipCount(): Promise<bigint> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Run sync.mjs first.');
  }
  if (!tipWallAbi || (Array.isArray(tipWallAbi) && tipWallAbi.length === 0)) {
    throw new Error('ABI not loaded. Run sync.mjs first.');
  }
  
  const count = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'tipCount',
  });
  return count as bigint;
}

/**
 * Read a specific tip by index
 * 
 * Note: The timestamp is returned as bigint (Solidity uint40).
 * Convert to Date: new Date(Number(tip.timestamp) * 1000)
 */
export async function getTip(index: number): Promise<Tip> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Run sync.mjs first.');
  }
  if (!tipWallAbi || (Array.isArray(tipWallAbi) && tipWallAbi.length === 0)) {
    throw new Error('ABI not loaded. Run sync.mjs first.');
  }
  
  const tip = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'getTip',
    args: [BigInt(index)],
  });
  return tip as Tip;
}

/**
 * Read the contract owner address
 */
export async function getOwner(): Promise<`0x${string}`> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Run sync.mjs first.');
  }
  if (!tipWallAbi || (Array.isArray(tipWallAbi) && tipWallAbi.length === 0)) {
    throw new Error('ABI not loaded. Run sync.mjs first.');
  }
  
  const owner = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'owner',
  });
  return owner as `0x${string}`;
}

/**
 * Fetch all tips from the contract
 * 
 * Note: This fetches tips sequentially which can be slow for large counts.
 * For production, consider using multicall or event logs instead.
 */
export async function getAllTips(): Promise<Tip[]> {
  const count = await getTipCount();
  const tips: Tip[] = [];
  
  // Fetch tips in reverse order (newest first) and limit to 50
  const countNum = Number(count);
  const startIndex = Math.max(0, countNum - 50);
  
  for (let i = countNum - 1; i >= startIndex; i--) {
    try {
      const tip = await getTip(i);
      tips.push(tip);
    } catch (error) {
      console.error(`Failed to fetch tip ${i}:`, error);
      // Continue fetching other tips even if one fails
    }
  }
  
  return tips;
}
