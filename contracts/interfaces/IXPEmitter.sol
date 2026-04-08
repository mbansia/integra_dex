// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IXPEmitter {
    event XPAction(address indexed user, string actionType, uint256 points);
}
