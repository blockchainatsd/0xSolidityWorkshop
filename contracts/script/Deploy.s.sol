// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TipWall} from "../src/TipWall.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        
        TipWall tipWall = new TipWall();
        
        console.log("TipWall deployed at:", address(tipWall));
        
        vm.stopBroadcast();
    }
}
