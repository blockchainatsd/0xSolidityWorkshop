/**
 * Example: Reading contract state with viem
 * 
 * This file demonstrates how to use viem to read data from the TipWall contract.
 */

import { publicClient } from '../viem';
import tipWallAbi from '../abi/TipWall.json';

// Get contract address from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

/**
 * Read the total amount of ETH tipped to the contract
 */
export async function getTotalTipped(): Promise<bigint> {
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
  const count = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'tipCount',
  });
  return count as bigint;
}

/**
 * Read a specific tip by index
 */
export async function getTip(index: number): Promise<{
  from: `0x${string}`;
  amount: bigint;
  timestamp: number;
  message: string;
}> {
  const tip = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'getTip',
    args: [BigInt(index)],
  });
  return tip as {
    from: `0x${string}`;
    amount: bigint;
    timestamp: number;
    message: string;
  };
}

/**
 * Read the contract owner address
 */
export async function getOwner(): Promise<`0x${string}`> {
  const owner = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'owner',
  });
  return owner as `0x${string}`;
}

/**
 * Fetch all tips from the contract
 */
export async function getAllTips(): Promise<Array<{
  from: `0x${string}`;
  amount: bigint;
  timestamp: number;
  message: string;
}>> {
  const count = await getTipCount();
  const tips = [];
  
  for (let i = 0; i < Number(count); i++) {
    const tip = await getTip(i);
    tips.push(tip);
  }
  
  return tips;
}
