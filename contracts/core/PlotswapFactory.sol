// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPlotswapFactory.sol";
import "./PlotswapPair.sol";

contract PlotswapFactory is IPlotswapFactory {
    error PlotswapFactory__IdenticalAddresses();
    error PlotswapFactory__ZeroAddress();
    error PlotswapFactory__PairExists();
    error PlotswapFactory__Forbidden();

    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        if (tokenA == tokenB) revert PlotswapFactory__IdenticalAddresses();
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        if (token0 == address(0)) revert PlotswapFactory__ZeroAddress();
        if (getPair[token0][token1] != address(0))
            revert PlotswapFactory__PairExists();

        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        PlotswapPair newPair = new PlotswapPair{salt: salt}();
        newPair.initialize(token0, token1);

        pair = address(newPair);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        if (msg.sender != feeToSetter) revert PlotswapFactory__Forbidden();
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        if (msg.sender != feeToSetter) revert PlotswapFactory__Forbidden();
        feeToSetter = _feeToSetter;
    }
}
