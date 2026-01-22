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
        uint256 length = bytes(message).length;
        if (length == 0) revert EmptyMessage();
        if (length > MAX_MESSAGE_LENGTH) revert MessageTooLong(length, MAX_MESSAGE_LENGTH);
        if (msg.value == 0) revert ZeroTip();

        tips.push(Tip({
            from: msg.sender,
            amount: msg.value,
            timestamp: uint40(block.timestamp),
            message: message
        }));

        totalTipped += msg.value;
        emit NewTip(msg.sender, msg.value, uint40(block.timestamp), message);
    }

    // -----------------------------
    // Reads for the frontend
    // -----------------------------
    function tipCount() external view returns (uint256) {
        return tips.length;
    }

    function getTip(uint256 i) external view returns (Tip memory) {
        return tips[i];
    }

    // -----------------------------
    // Owner: withdraw contract balance
    // -----------------------------
    function withdraw() external {
        if (msg.sender != owner) revert NotOwner();

        uint256 amount = address(this).balance;
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "withdraw failed");

        emit Withdraw(owner, amount);
    }

    // Optional helper (nice for debugging in the UI)
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
