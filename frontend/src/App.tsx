import { useState, useEffect, useCallback } from 'react';
import { formatEther, parseEther } from 'viem';
import { publicClient, createWalletClientFromProvider, connectWallet } from './viem';
import abi from './abi/TipWall.json';

import './App.css';

// Contract address from environment variable (set by sync.mjs)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

// Tip type matching the contract struct
interface Tip {
  from: `0x${string}`;
  amount: bigint;
  timestamp: number;
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
  const [contractBalance, setContractBalance] = useState<bigint>(0n);

  // Form state
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [isSending, setIsSending] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Status messages
  const [status, setStatus] = useState('');

  /**
   * Load contract data
   */
  const loadContractData = useCallback(async () => {
    if (!CONTRACT_ADDRESS) {
      console.error('Contract address not set. Run sync.mjs first.');
      return;
    }

    try {
      // Read totalTipped
      const total = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'totalTipped',
      });
      setTotalTipped(total as bigint);

      // Read owner
      const ownerAddr = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'owner',
      });
      setOwner(ownerAddr as `0x${string}`);

      // Read contract balance
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'contractBalance',
      });
      setContractBalance(balance as bigint);

      // Read tip count
      const count = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'tipCount',
      });
      const tipCount = Number(count);

      // Fetch all tips
      const fetchedTips: Tip[] = [];
      for (let i = 0; i < tipCount; i++) {
        const tipData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getTip',
          args: [BigInt(i)],
        }) as readonly [string, bigint, number, string];
        
        fetchedTips.push({
          from: tipData[0] as `0x${string}`,
          amount: tipData[1],
          timestamp: Number(tipData[2]),
          message: tipData[3],
        });
      }
      setTips(fetchedTips);
    } catch (error) {
      console.error('Failed to load contract data:', error);
    }
  }, []);

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
   * Send tip handler
   */
  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !message || !amount || !CONTRACT_ADDRESS) return;

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
      setStatus('Tip sent successfully! 🎉');
      setMessage('');
      await loadContractData();
    } catch (error) {
      console.error('Failed to send tip:', error);
      setStatus('Failed to send tip. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Withdraw handler (owner only)
   */
  const handleWithdraw = async () => {
    if (!account || !CONTRACT_ADDRESS) return;

    setIsWithdrawing(true);
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
      setStatus('Withdrawal successful! 💰');
      await loadContractData();
    } catch (error) {
      console.error('Failed to withdraw:', error);
      setStatus('Failed to withdraw. Check console for details.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * Subscribe to NewTip events for real-time updates
   */
  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;

    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi,
      eventName: 'NewTip',
      onLogs: (logs) => {
        logs.forEach(log => {
          const args = log.args as {
            from: `0x${string}`;
            amount: bigint;
            timestamp: number;
            message: string;
          };
          const newTip: Tip = {
            from: args.from,
            amount: args.amount,
            timestamp: Number(args.timestamp),
            message: args.message,
          };
          setTips(prev => [...prev, newTip]);
          setTotalTipped(prev => prev + args.amount);
        });
      },
    });

    return () => unwatch();
  }, []);

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
        <div className="info-card">
          <h3>Contract Balance</h3>
          <span className="amount">{formatEther(contractBalance)} ETH</span>
        </div>
        <div className="info-card">
          <h3>Number of Tips</h3>
          <span className="amount">{tips.length}</span>
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
          <p>You are the contract owner.</p>
          <button 
            onClick={handleWithdraw} 
            className="withdraw-btn"
            disabled={isWithdrawing || contractBalance === 0n}
          >
            {isWithdrawing ? 'Withdrawing...' : `Withdraw ${formatEther(contractBalance)} ETH`}
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
                  {new Date(tip.timestamp * 1000).toLocaleString()}
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
