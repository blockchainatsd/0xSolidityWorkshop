/**
 * Example: Writing to contract with viem (sending transactions)
 * 
 * This file demonstrates how to use viem to send transactions to the TipWall contract.
 */

import { parseEther } from 'viem';
import { publicClient, createWalletClientFromProvider } from '../viem';
import tipWallAbi from '../abi/TipWall.json';

// Get contract address from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

/**
 * Send a tip with a message
 * 
 * @param message - The message to include with the tip (max 80 chars)
 * @param amountEth - The amount of ETH to tip (e.g., "0.01" for 0.01 ETH)
 * @returns The transaction hash
 */
export async function sendTip(message: string, amountEth: string): Promise<`0x${string}`> {
  // Get wallet client from browser provider (MetaMask)
  const walletClient = await createWalletClientFromProvider();
  
  // Get the connected account
  const [account] = await walletClient.getAddresses();
  
  // Send the transaction
  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'tip',
    args: [message],
    value: parseEther(amountEth), // Convert ETH string to wei
    account,
  });
  
  return txHash;
}

/**
 * Send a tip and wait for confirmation
 * 
 * @param message - The message to include with the tip
 * @param amountEth - The amount of ETH to tip
 * @returns The transaction receipt
 */
export async function sendTipAndWait(message: string, amountEth: string) {
  // Send the transaction
  const txHash = await sendTip(message, amountEth);
  
  console.log('Transaction sent:', txHash);
  
  // Wait for the transaction to be confirmed
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  
  console.log('Transaction confirmed in block:', receipt.blockNumber);
  
  return receipt;
}

/**
 * Withdraw all funds (owner only)
 * 
 * @returns The transaction hash
 */
export async function withdraw(): Promise<`0x${string}`> {
  const walletClient = await createWalletClientFromProvider();
  const [account] = await walletClient.getAddresses();
  
  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    functionName: 'withdraw',
    account,
  });
  
  return txHash;
}
