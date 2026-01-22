/**
 * Example: Watching contract events with viem
 * 
 * This file demonstrates how to subscribe to real-time events from the TipWall contract.
 * 
 * NOTE: This requires the ABI to be synced first by running `node scripts/sync.mjs`
 */

import { publicClient } from '../viem';
import tipWallAbi from '../abi/TipWall.json';

// Get contract address from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

// Type definitions for event arguments
// Note: timestamp is bigint because Solidity uint40 is returned as bigint by viem
interface NewTipArgs {
  from: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
  message: string;
}

interface WithdrawArgs {
  to: `0x${string}`;
  amount: bigint;
}

/**
 * Watch for new tips in real-time
 * 
 * @param onNewTip - Callback function called when a new tip is received
 * @returns Unwatch function to stop listening
 */
export function watchNewTips(
  onNewTip: (tip: NewTipArgs) => void
): () => void {
  if (!CONTRACT_ADDRESS) {
    console.error('Contract address not set. Run sync.mjs first.');
    return () => {};
  }
  if (!tipWallAbi || (Array.isArray(tipWallAbi) && tipWallAbi.length === 0)) {
    console.error('ABI not loaded. Run sync.mjs first.');
    return () => {};
  }
  
  const unwatch = publicClient.watchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    eventName: 'NewTip',
    onLogs: (logs) => {
      for (const log of logs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = (log as any).args as NewTipArgs;
        if (args) {
          onNewTip(args);
        }
      }
    },
  });

  return unwatch;
}

/**
 * Watch for withdrawals in real-time
 * 
 * @param onWithdraw - Callback function called when a withdrawal occurs
 * @returns Unwatch function to stop listening
 */
export function watchWithdrawals(
  onWithdraw: (data: WithdrawArgs) => void
): () => void {
  if (!CONTRACT_ADDRESS) {
    console.error('Contract address not set. Run sync.mjs first.');
    return () => {};
  }
  if (!tipWallAbi || (Array.isArray(tipWallAbi) && tipWallAbi.length === 0)) {
    console.error('ABI not loaded. Run sync.mjs first.');
    return () => {};
  }
  
  const unwatch = publicClient.watchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: tipWallAbi,
    eventName: 'Withdraw',
    onLogs: (logs) => {
      for (const log of logs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = (log as any).args as WithdrawArgs;
        if (args) {
          onWithdraw(args);
        }
      }
    },
  });

  return unwatch;
}

// =============================================================================
// Usage Example in React
// =============================================================================
// 
// import { useEffect, useState } from 'react';
// import { watchNewTips } from './examples/watchEvents';
// 
// function TipWatcher() {
//   const [tips, setTips] = useState<Array<{...}>>([]);
//   
//   useEffect(() => {
//     // Start watching for new tips
//     const unwatch = watchNewTips((newTip) => {
//       console.log('New tip received!', newTip);
//       setTips((prev) => [...prev, newTip]);
//     });
//     
//     // Cleanup: stop watching when component unmounts
//     return () => {
//       unwatch();
//     };
//   }, []);
//   
//   return (
//     <div>
//       {tips.map((tip, i) => (
//         <div key={i}>{tip.message}</div>
//       ))}
//     </div>
//   );
// }
