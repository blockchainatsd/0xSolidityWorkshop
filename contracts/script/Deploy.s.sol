// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TipWall} from "../src/TipWall.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        // TODO: Use vm.startBroadcast() to start the deployment
        // Hint: vm.startBroadcast();
        
        // TODO: Deploy the TipWall contract
        // Hint: TipWall tipWall = new TipWall();
        
        // TODO: Log the deployed address
        // Hint: console.log("TipWall deployed at:", address(tipWall));
        
        // TODO: Use vm.stopBroadcast() to stop the deployment
        // Hint: vm.stopBroadcast();
    }
}
