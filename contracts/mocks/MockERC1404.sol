// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC1404.sol";

contract MockERC1404 is ERC20, Ownable {
    mapping(address => bool) public whitelist;

    uint8 public constant SUCCESS_CODE = 0;
    uint8 public constant ERR_SENDER_NOT_WHITELISTED = 1;
    uint8 public constant ERR_RECEIVER_NOT_WHITELISTED = 2;

    string public constant SUCCESS_MESSAGE = "No restriction";
    string public constant ERR_SENDER_MSG = "Sender not whitelisted";
    string public constant ERR_RECEIVER_MSG = "Receiver not whitelisted";

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        whitelist[msg.sender] = true;
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    function setWhitelist(address account, bool status) external onlyOwner {
        whitelist[account] = status;
    }

    function setWhitelistBatch(
        address[] calldata accounts,
        bool status
    ) external onlyOwner {
        for (uint256 i; i < accounts.length; i++) {
            whitelist[accounts[i]] = status;
        }
    }

    function detectTransferRestriction(
        address from,
        address to,
        uint256
    ) external view returns (uint8) {
        if (from != address(0) && !whitelist[from])
            return ERR_SENDER_NOT_WHITELISTED;
        if (to != address(0) && !whitelist[to])
            return ERR_RECEIVER_NOT_WHITELISTED;
        return SUCCESS_CODE;
    }

    function messageForTransferRestriction(
        uint8 restrictionCode
    ) external pure returns (string memory) {
        if (restrictionCode == SUCCESS_CODE) return SUCCESS_MESSAGE;
        if (restrictionCode == ERR_SENDER_NOT_WHITELISTED)
            return ERR_SENDER_MSG;
        if (restrictionCode == ERR_RECEIVER_NOT_WHITELISTED)
            return ERR_RECEIVER_MSG;
        return "Unknown restriction";
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0) && !whitelist[from])
            revert("ERC1404: sender not whitelisted");
        if (to != address(0) && !whitelist[to])
            revert("ERC1404: receiver not whitelisted");
        super._update(from, to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
