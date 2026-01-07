import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { foundry } from 'viem/chains';

// Anvil RPC endpoint
const ANVIL_RPC = 'http://127.0.0.1:8545';

/**
 * Public client for reading contract state.
 * Uses HTTP transport to connect to local Anvil node.
 */
export const publicClient = createPublicClient({
  chain: foundry,
  transport: http(ANVIL_RPC),
});

/**
 * Creates a wallet client using the browser's injected provider (MetaMask).
 * 
 * TODO: Call this after connecting wallet:
 *   const walletClient = await createWalletClientFromProvider();
 *   const [address] = await walletClient.getAddresses();
 */
export async function createWalletClientFromProvider() {
  // Check if MetaMask (or another wallet) is available
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet provider found. Please install MetaMask.');
  }

  const walletClient = createWalletClient({
    chain: foundry,
    transport: custom(window.ethereum),
  });

  return walletClient;
}

/**
 * Request wallet connection.
 * Returns the connected address.
 */
export async function connectWallet(): Promise<`0x${string}`> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet provider found. Please install MetaMask.');
  }

  // Request account access
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  }) as `0x${string}`[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  return accounts[0];
}

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
