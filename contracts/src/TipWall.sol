// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TipWall
/// @notice A tiny on-chain tip jar + message wall.
/// @dev Workshop contract: students implement the TODOs (do not “fill in” for them here).
contract TipWall {
    // -----------------------------
    // Data Types
    // -----------------------------
    struct Tip {
        address from;
        uint256 amount;
        uint40 timestamp;
        string message;
    }

    // -----------------------------
    // Events (frontends can listen)
    // -----------------------------
    event NewTip(address indexed from, uint256 amount, uint40 timestamp, string message);
    event Withdraw(address indexed to, uint256 amount);

    // -----------------------------
    // Custom Errors (cheaper than strings)
    // -----------------------------
    error NotOwner();
    error EmptyMessage();
    error MessageTooLong(uint256 length, uint256 max);
    error ZeroTip();

    // -----------------------------
    // State
    // -----------------------------
    address public immutable owner;
    uint256 public totalTipped;

    // Keep tips private; expose via getter functions you write below.
    Tip[] private tips;

    uint256 public constant MAX_MESSAGE_LENGTH = 80;

    constructor() {
        owner = msg.sender; // deployer becomes owner
    }

    // -----------------------------
    // Write: send an ETH tip + message
    // -----------------------------
    function tip(string calldata message) external payable {
        // TODO 1: Reject empty message
        //   Hint: bytes(message).length == 0
        //
        // TODO 2: Enforce max message length (MAX_MESSAGE_LENGTH)
        //
        // TODO 3 (optional but recommended): reject msg.value == 0
        //
        // TODO 4: Store the tip in the array
        //   Hint: tips.push(Tip({ from: ..., amount: ..., timestamp: ..., message: ... }))
        //
        // TODO 5: Update totalTipped
        //
        // TODO 6: Emit NewTip
        //   Hint: emit NewTip(msg.sender, msg.value, uint40(block.timestamp), message);
    }

    // -----------------------------
    // Reads for the frontend
    // -----------------------------
    function tipCount() external view returns (uint256) {
        // TODO: return how many tips exist
        // Hint: tips.length
        return 0;
    }

    function getTip(uint256 i) external view returns (Tip memory) {
        // TODO: return the i-th tip
        // Hint: return tips[i];
        Tip memory t;
        return t;
    }

    // -----------------------------
    // Owner: withdraw contract balance
    // -----------------------------
    function withdraw() external {
        // TODO 1: only owner can withdraw
        //   Hint: if (msg.sender != owner) revert NotOwner();
        //
        // TODO 2: get current balance
        //   Hint: uint256 amount = address(this).balance;
        //
        // TODO 3: send ETH to owner using .call
        //   Hint:
        //     (bool ok, ) = payable(owner).call{value: amount}("");
        //     require(ok, "withdraw failed");
        //
        // TODO 4: emit Withdraw(owner, amount);
    }

    // Optional helper (nice for debugging in the UI)
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
