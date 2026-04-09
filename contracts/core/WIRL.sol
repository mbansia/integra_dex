// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title WIRL — Wrapped IRL (native token wrapper, like WETH)
contract WIRL is ERC20 {
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);

    constructor() ERC20("Wrapped IRL", "WIRL") {}

    /// @notice Wrap native IRL into WIRL
    receive() external payable {
        deposit();
    }

    /// @notice Wrap native IRL into WIRL
    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Unwrap WIRL back to native IRL
    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "WIRL: IRL transfer failed");
        emit Withdrawal(msg.sender, amount);
    }
}
