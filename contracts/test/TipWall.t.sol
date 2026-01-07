// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TipWall} from "../src/TipWall.sol";

contract TipWallTest is Test {
    TipWall public tipWall;
    address public owner;
    address public tipper;

    event NewTip(address indexed from, uint256 amount, uint40 timestamp, string message);
    event Withdraw(address indexed to, uint256 amount);

    function setUp() public {
        owner = address(this);
        tipper = makeAddr("tipper");
        tipWall = new TipWall();
        
        // Fund tipper with some ETH
        vm.deal(tipper, 10 ether);
    }

    // ===== Basic State Tests =====
    
    function test_OwnerIsDeployer() public view {
        assertEq(tipWall.owner(), owner);
    }

    function test_InitialTotalTippedIsZero() public view {
        assertEq(tipWall.totalTipped(), 0);
    }

    function test_InitialTipCountIsZero() public view {
        assertEq(tipWall.tipCount(), 0);
    }

    // ===== Tip Function Tests =====

    function test_TipEmitsEvent() public {
        vm.prank(tipper);
        vm.expectEmit(true, false, false, true);
        emit NewTip(tipper, 1 ether, uint40(block.timestamp), "Hello!");
        tipWall.tip{value: 1 ether}("Hello!");
    }

    function test_TipIncreasesTotalTipped() public {
        vm.prank(tipper);
        tipWall.tip{value: 1 ether}("First tip");
        assertEq(tipWall.totalTipped(), 1 ether);

        vm.prank(tipper);
        tipWall.tip{value: 0.5 ether}("Second tip");
        assertEq(tipWall.totalTipped(), 1.5 ether);
    }

    function test_TipIncrementsTipCount() public {
        vm.prank(tipper);
        tipWall.tip{value: 1 ether}("Tip 1");
        assertEq(tipWall.tipCount(), 1);

        vm.prank(tipper);
        tipWall.tip{value: 1 ether}("Tip 2");
        assertEq(tipWall.tipCount(), 2);
    }

    function test_GetTipReturnsCorrectData() public {
        vm.prank(tipper);
        tipWall.tip{value: 1 ether}("Test message");

        TipWall.Tip memory t = tipWall.getTip(0);
        assertEq(t.from, tipper);
        assertEq(t.amount, 1 ether);
        assertEq(t.message, "Test message");
    }

    function test_RevertOnEmptyMessage() public {
        vm.prank(tipper);
        vm.expectRevert(TipWall.EmptyMessage.selector);
        tipWall.tip{value: 1 ether}("");
    }

    function test_RevertOnMessageTooLong() public {
        // 81 characters - over the limit of 80
        string memory longMessage = "12345678901234567890123456789012345678901234567890123456789012345678901234567890X";
        vm.prank(tipper);
        vm.expectRevert();
        tipWall.tip{value: 1 ether}(longMessage);
    }

    function test_MessageAtExactMaxLength() public {
        // Exactly 80 characters - should succeed
        string memory exactMessage = "12345678901234567890123456789012345678901234567890123456789012345678901234567890";
        vm.prank(tipper);
        tipWall.tip{value: 1 ether}(exactMessage);
        assertEq(tipWall.tipCount(), 1);
    }

    // ===== Withdraw Tests =====

    function test_WithdrawOnlyOwner() public {
        // First, send some tips
        vm.prank(tipper);
        tipWall.tip{value: 1 ether}("Tip for withdraw test");

        // Try to withdraw as non-owner - should revert
        vm.prank(tipper);
        vm.expectRevert(TipWall.NotOwner.selector);
        tipWall.withdraw();
    }

    function test_WithdrawSendsBalance() public {
        // Send some tips
        vm.prank(tipper);
        tipWall.tip{value: 2 ether}("Big tip");

        uint256 ownerBalanceBefore = owner.balance;
        
        tipWall.withdraw();
        
        assertEq(owner.balance, ownerBalanceBefore + 2 ether);
        assertEq(tipWall.contractBalance(), 0);
    }

    function test_WithdrawEmitsEvent() public {
        vm.prank(tipper);
        tipWall.tip{value: 1 ether}("Tip");

        vm.expectEmit(true, false, false, true);
        emit Withdraw(owner, 1 ether);
        tipWall.withdraw();
    }

    // ===== Contract Balance Test =====

    function test_ContractBalanceReflectsTips() public {
        assertEq(tipWall.contractBalance(), 0);
        
        vm.prank(tipper);
        tipWall.tip{value: 1.5 ether}("Check balance");
        
        assertEq(tipWall.contractBalance(), 1.5 ether);
    }

    // Allow this contract to receive ETH (for withdraw tests)
    receive() external payable {}
}
