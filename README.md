# TipWall Workshop (Foundry + viem) — Build the Contract + Build the Frontend

In this workshop you will **create**:

1. a **Solidity smart contract** (backend) using **Foundry**, and
2. a **web frontend** using **Vite + React + viem** that talks to your contract.

You’ll work in your **own fork** of this repo and commit your changes there.

---

## What you’re building

**TipWall** = a tip jar + message board:

- Anyone can send an **ETH tip** with a short **message**
- The DApp shows:
  - **total ETH tipped**
  - a list of **recent tips**
- The UI updates in real time by listening to the **NewTip** event
- The **owner** can withdraw the balance

---

## Repo layout

```

contracts/ # Foundry project (YOU implement the contract)
frontend/ # Vite + React app (YOU implement the UI)
scripts/ # helper to copy ABI + deployed address into frontend

```

---

## Prerequisites

- Git
- Node.js 18+ and npm
- Foundry (`forge`, `cast`, `anvil`)
  Install: https://book.getfoundry.sh/getting-started/installation
- MetaMask browser extension

---

## 0) Fork + clone

1. Fork this repo to your GitHub account.
2. Clone your fork:

```bash
git clone https://github.com/blockchainatsd/0xSolidityWorkshop.git
cd 0xSolidityWorkshop
```

---

## Part A — Smart Contract (Foundry)

### A1) Start Anvil (local chain)

In Terminal A:

```bash
anvil
```

Keep it running. You’ll use:

- RPC: `http://127.0.0.1:8545`
- One of the printed private keys to deploy

---

### A2) Implement the contract

Open this file:

- `contracts/src/TipWall.sol`

Your job is to implement a `TipWall` contract with:

**Storage**

- `owner` (set at deployment)
- `totalTipped`
- an array of tips

**Tip struct**

- `from` (address)
- `amount` (uint256)
- `timestamp` (uint40)
- `message` (string)

**Events**

- `NewTip(address indexed from, uint256 amount, uint40 timestamp, string message)`
- `Withdraw(address indexed to, uint256 amount)`

**Errors (optional but recommended)**

- `NotOwner()`
- `EmptyMessage()`
- `MessageTooLong()`

**Functions**

- `tip(string calldata message) external payable`
  - reverts on empty message
  - reverts if message is too long (suggestion: 80 chars)
  - stores the tip
  - increases `totalTipped`
  - emits `NewTip`

- `tipCount() external view returns (uint256)`
- `getTip(uint256 i) external view returns (Tip memory)`
- `withdraw() external`
  - only owner
  - sends full balance to owner
  - emits `Withdraw`

> **Goal:** Your contract compiles and passes the tests.

## Solidity Crash Course (what you need today)

### Files & basics

- Every contract file starts with:
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.24;
  ```

* A contract is like a class:

  ```solidity
  contract TipWall { ... }
  ```

### Key globals

- `msg.sender` = the address calling the function
- `msg.value` = how much ETH (wei) was sent with the call
- `block.timestamp` = current block time (seconds)

### Payable functions (receiving ETH)

To allow ETH to be sent:

```solidity
function tip(string calldata message) external payable { ... }
```

### Strings & length checks

Solidity can’t do `message.length` directly on `string`. Convert to bytes:

```solidity
uint256 len = bytes(message).length;
if (len == 0) revert EmptyMessage();
if (len > MAX_MESSAGE_LENGTH) revert MessageTooLong(len, MAX_MESSAGE_LENGTH);
```

### Arrays (store tips)

`tips` is an array in storage:

```solidity
Tip[] private tips;
```

Add an item:

```solidity
tips.push(Tip({
  from: msg.sender,
  amount: msg.value,
  timestamp: uint40(block.timestamp),
  message: message
}));
```

Read count:

```solidity
return tips.length;
```

Read element:

```solidity
return tips[i]; // reverts automatically if i is out of bounds
```

### Events (for live UI updates)

Emit an event:

```solidity
emit NewTip(msg.sender, msg.value, uint40(block.timestamp), message);
```

Your frontend can subscribe to `NewTip` and update the UI instantly.

### Access control (owner-only)

Create owner on deploy:

```solidity
address public immutable owner;
constructor() { owner = msg.sender; }
```

Restrict a function:

```solidity
if (msg.sender != owner) revert NotOwner();
```

### Sending ETH out (withdraw)

Use `.call` (recommended):

```solidity
uint256 amount = address(this).balance;
(bool ok, ) = payable(owner).call{value: amount}("");
require(ok, "withdraw failed");
```

### Common keywords

- `external` = called from outside (frontend/wallet)
- `view` = read-only (no state changes)
- `memory` = temporary data for returning structs/strings
- `calldata` = read-only function input (cheaper for external functions)

### Run your checks

From `/contracts`:

```bash
forge build
forge test -vvv
```

---

### A3) Run tests (they guide you)

In Terminal B:

```bash
cd contracts
forge test -vvv
```

Fix the contract until tests are green.

---

### A4) Review the deploy script

The deploy script is already implemented at:

- `contracts/script/Deploy.s.sol`

It uses `vm.startBroadcast()` / `vm.stopBroadcast()` to deploy the TipWall contract and logs the deployed address.

---

### A5) Deploy to Anvil

Copy a private key from the Anvil output (Terminal A), then run in Terminal B:

```bash
cd contracts

forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY_FROM_ANVIL> \
  --broadcast

cd ..
```

After deployment, Foundry writes a `run-latest.json` into `contracts/broadcast/...`.

---

### A6) Sync ABI + contract address into the frontend

From repo root:

```bash
node scripts/sync.mjs
```

This should:

- copy ABI to `frontend/src/abi/TipWall.json`
- write the deployed address to `frontend/.env.local` as:
  - `VITE_CONTRACT_ADDRESS=0x...`

If this fails, you probably didn’t deploy with `--broadcast`.

---

## Part B — Frontend (Vite + React + viem)

### B1) Install frontend dependencies

```bash
cd frontend
npm install
```

---

### B2) Implement viem wiring

Open:

- `frontend/src/viem.ts`

Implement:

- a `publicClient` using Anvil RPC (`http://127.0.0.1:8545`) and the `foundry` chain
- a helper to create a `walletClient` using `custom(window.ethereum)`

---

### B3) Implement the UI

Open:

- `frontend/src/App.tsx`

Build a single-page app with:

**Required UI**

- “Connect Wallet” button
- Display:
  - connected address
  - contract address
  - total tipped
  - list of recent tips (suggest: last 20)

**Required behaviors (viem)**

- Read contract state with `publicClient.readContract`:
  - `totalTipped()`
  - `tipCount()`
  - `getTip(i)` (loop to fetch tips)

- Send a tip with `walletClient.writeContract`:
  - call `tip(message)` with `value: parseEther(amount)`

- Wait for confirmation with `publicClient.waitForTransactionReceipt`
- Live updates:
  - subscribe to `NewTip` with `publicClient.watchContractEvent`
  - update the UI when new tips come in

> **Goal:** You can tip from the UI and see your message show up immediately.

---

### Viem Example Code

Not sure how to use viem? Check out the example scripts in `frontend/src/examples/`:

| File               | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `readContract.ts`  | Read contract state (`totalTipped`, `tipCount`, `getTip`, `owner`) |
| `writeContract.ts` | Send transactions (`sendTip`, `withdraw`)                          |
| `watchEvents.ts`   | Subscribe to real-time events (`NewTip`, `Withdraw`)               |

**Usage example:**

```typescript
import { getTotalTipped, getAllTips } from "./examples/readContract";
import { sendTipAndWait } from "./examples/writeContract";
import { watchNewTips } from "./examples/watchEvents";

// Read total tipped
const total = await getTotalTipped();

// Send a tip
await sendTipAndWait("Hello world!", "0.01");

// Watch for new tips in real-time
const unwatch = watchNewTips((tip) => {
  console.log("New tip:", tip);
});
```

---

### B4) Run the frontend

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

---

## MetaMask setup (required)

### Add Anvil as a network

MetaMask → Settings → Networks → Add network:

- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency:** `ETH`

### Import an Anvil account

MetaMask → “Import account” → paste a private key from Anvil output.

Now you’ll have test ETH to send tips.

---

## Success checklist

### Contract ✅

- [ ] `forge build` passes
- [ ] `forge test` passes
- [ ] deployed to Anvil with `--broadcast`
- [ ] `node scripts/sync.mjs` creates `frontend/.env.local` and ABI json

### Frontend ✅

- [ ] connects wallet
- [ ] reads total tipped + recent tips
- [ ] sends tip tx and updates after confirmation
- [ ] updates in real-time via `watchContractEvent(NewTip)`

---

## Stretch goals (optional)

Pick 1–2 if you finish early:

- **Owner withdraw UI**
  - Read `owner()`
  - Show “Withdraw” only if `account === owner`
  - Call `withdraw()`

- **My tips filter**
  - Toggle to only show tips where `from === account`

- **Better UX**
  - Disable button while tx pending
  - Show “pending/confirmed”
  - Display human-readable timestamp

---

## Troubleshooting

**Contract address is undefined**

- You skipped deploy or sync. Re-run:
  1. deploy with `--broadcast`
  2. `node scripts/sync.mjs`

**Wrong network**

- Switch MetaMask to Anvil network (Chain ID `31337`)

**Weird tx errors / nonce issues**

- Restart Anvil, redeploy, re-sync

---

## Suggested commit workflow

Commit after each milestone:

```bash
git status
git add -A
git commit -m "Implement TipWall contract"
git push
```

---

## License

MIT
