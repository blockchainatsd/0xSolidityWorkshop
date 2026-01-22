import { useState, useEffect, useCallback } from 'react';
import { formatEther, parseEther } from 'viem';
import { publicClient, createWalletClientFromProvider, connectWallet } from './viem';
import abi from './abi/TipWall.json';

import './App.css';

// Contract address from environment variable (set by sync.mjs)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

// Tip type matching the contract struct
// Note: timestamp is bigint because Solidity uint40 is returned as bigint by viem
interface Tip {
  from: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
  message: string;
}

function App() {
  // Wallet state
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract state
  const [totalTipped, setTotalTipped] = useState<bigint>(0n);
  const [tips, setTips] = useState<Tip[]>([]);
  const [owner, setOwner] = useState<`0x${string}` | null>(null);

  // Form state
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [isSending, setIsSending] = useState(false);

  // Status messages
  const [status, setStatus] = useState('');


  /**
   * TODO: Load contract data
   * 
   * Use publicClient.readContract to read:
   * - totalTipped()
   * - tipCount()
   * - owner()
   * - Loop through tips with getTip(i)
   */
  const loadContractData = useCallback(async () => {
    if (!CONTRACT_ADDRESS) {
      console.error('Contract address not set. Run sync.mjs first.');
      return;
    }

    try {
      const [total, count, contractOwner] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'totalTipped',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'tipCount',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'owner',
        }) as Promise<`0x${string}`>,
      ]);

      const countNumber = Number(count);
      const tipPromises = Array.from({ length: countNumber }, (_, offset) =>
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getTip',
          args: [BigInt(offset)],
        }) as Promise<Tip>
      );

      const loadedTips = await Promise.all(tipPromises);

      setTotalTipped(total);
      setOwner(contractOwner);
      setTips(loadedTips);
    } catch (error) {
      console.error('Failed to load contract data:', error);
      setStatus('Failed to load contract data');
    }
  }, [CONTRACT_ADDRESS]);

  /**
   * Connect wallet handler
   */
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setAccount(address);
      setStatus('Wallet connected!');
    } catch (error) {
      console.error('Failed to connect:', error);
      setStatus('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * TODO: Send tip handler
   * 
   * Use walletClient.writeContract to call:
   * - tip(message) with value: parseEther(amount)
   * 
   * Then use publicClient.waitForTransactionReceipt to wait for confirmation.
   */
  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !message || !amount) return;
    if (!CONTRACT_ADDRESS) {
      setStatus('Contract address not set. Run sync.mjs first.');
      return;
    }

    setIsSending(true);
    setStatus('Sending tip...');

    try {
      const walletClient = await createWalletClientFromProvider();
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'tip',
        args: [message],
        value: parseEther(amount),
        account,
      });

      setStatus('Waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus('Tip sent!');
      setMessage('');
      await loadContractData();
    } catch (error) {
      console.error('Failed to send tip:', error);
      setStatus('Failed to send tip');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * TODO: Withdraw handler (owner only)
   */
  const handleWithdraw = async () => {
    if (!account) {
      setStatus('Connect wallet first');
      return;
    }
    if (!CONTRACT_ADDRESS) {
      setStatus('Contract address not set. Run sync.mjs first.');
      return;
    }

    setIsSending(true);
    setStatus('Withdrawing...');

    try {
      const walletClient = await createWalletClientFromProvider();
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'withdraw',
        account,
      });

      setStatus('Waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus('Withdraw complete');
      await loadContractData();
    } catch (error) {
      console.error('Failed to withdraw:', error);
      setStatus('Failed to withdraw');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * TODO: Subscribe to NewTip events
   * 
   * Use publicClient.watchContractEvent to listen for NewTip events
   * and update the UI in real-time.
   */
  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;

    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi,
      eventName: 'NewTip',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { from, amount, timestamp, message } = log.args as {
            from: `0x${string}`;
            amount: bigint;
            timestamp: bigint;
            message: string;
          };

          const newTip: Tip = { from, amount, timestamp, message };

          setTips((prev) => [...prev, newTip]);
          setTotalTipped((prev) => prev + amount);
        });
      },
    });

    return () => unwatch();
  }, [CONTRACT_ADDRESS]);

  // Load data on mount
  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  return (
    <div className="app">
      <header>
        <h1>🫖 TipWall</h1>
        <p className="subtitle">A decentralized tip jar + message board</p>
      </header>

      {/* Wallet Connection */}
      <section className="wallet-section">
        {account ? (
          <div className="connected">
            <span className="address">Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
          </div>
        ) : (
          <button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="connect-btn"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </section>

      {/* Contract Info */}
      <section className="info-section">
        <div className="info-card">
          <h3>Contract Address</h3>
          <code>{CONTRACT_ADDRESS ?? 'Not set - run sync.mjs'}</code>
        </div>
        <div className="info-card">
          <h3>Total Tipped</h3>
          <span className="amount">{formatEther(totalTipped)} ETH</span>
        </div>
      </section>

      {/* Send Tip Form */}
      {account && (
        <section className="tip-form-section">
          <h2>Send a Tip</h2>
          <form onSubmit={handleSendTip}>
            <div className="form-group">
              <label htmlFor="message">Message (max 80 chars)</label>
              <input
                id="message"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={80}
                placeholder="Say something nice..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount (ETH)</label>
              <input
                id="amount"
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={isSending || !message}>
              {isSending ? 'Sending...' : `Send ${amount} ETH Tip`}
            </button>
          </form>
          {status && <p className="status">{status}</p>}
        </section>
      )}

      {/* Withdraw (Owner Only) */}
      {account && owner && account.toLowerCase() === owner.toLowerCase() && (
        <section className="withdraw-section">
          <h2>Owner Controls</h2>
          <button onClick={handleWithdraw} className="withdraw-btn">
            Withdraw Balance
          </button>
        </section>
      )}

      {/* Tips List */}
      <section className="tips-section">
        <h2>Recent Tips</h2>
        {tips.length === 0 ? (
          <p className="no-tips">No tips yet. Be the first!</p>
        ) : (
          <ul className="tips-list">
            {tips.slice(-20).reverse().map((tip, i) => (
              <li key={i} className="tip-item">
                <div className="tip-header">
                  <span className="tip-from">
                    {tip.from.slice(0, 6)}...{tip.from.slice(-4)}
                  </span>
                  <span className="tip-amount">{formatEther(tip.amount)} ETH</span>
                </div>
                <p className="tip-message">{tip.message}</p>
                <span className="tip-time">
                  {new Date(Number(tip.timestamp) * 1000).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
