// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IPlotswapFactory.sol";
import "../interfaces/IPlotswapPair.sol";
import "../interfaces/IPlotswapRouter.sol";
import "../interfaces/IERC1404.sol";
import "../interfaces/IXPEmitter.sol";
import "../libraries/PlotswapLibrary.sol";

interface IWIRL {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract PlotswapRouter is IPlotswapRouter, IXPEmitter {
    using SafeERC20 for IERC20;

    struct PoolInfo {
        address pool;
        address token0;
        address token1;
        uint112 reserve0;
        uint112 reserve1;
    }

    error PlotswapRouter__Expired();
    error PlotswapRouter__InsufficientAAmount();
    error PlotswapRouter__InsufficientBAmount();
    error PlotswapRouter__InsufficientOutputAmount();
    error PlotswapRouter__ExcessiveInputAmount();
    error PlotswapRouter__InvalidPath();
    error PlotswapRouter__EthTransferFailed();
    error PlotswapRouter__TransferRestricted(
        address token,
        uint8 code,
        string message
    );

    address public immutable factory;
    address public immutable WIRL;

    mapping(address => bool) public hasSwapped;

    modifier ensure(uint256 deadline) {
        if (deadline < block.timestamp) revert PlotswapRouter__Expired();
        _;
    }

    constructor(address _factory, address _WIRL) {
        factory = _factory;
        WIRL = _WIRL;
    }

    receive() external payable {
        if (msg.sender != WIRL) revert PlotswapRouter__EthTransferFailed();
    }

    function _checkTransferRestriction(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal view {
        try
            IERC1404(token).detectTransferRestriction(from, to, amount)
        returns (uint8 code) {
            if (code != 0) {
                string memory message = IERC1404(token)
                    .messageForTransferRestriction(code);
                revert PlotswapRouter__TransferRestricted(
                    token,
                    code,
                    message
                );
            }
        } catch {
            // Not an ERC-1404 token — proceed normally
        }
    }

    function _emitSwapXP(address user) internal {
        if (!hasSwapped[user]) {
            hasSwapped[user] = true;
            emit XPAction(user, "first_swap", 200);
        } else {
            emit XPAction(user, "swap", 100);
        }
    }

    // **** ADD LIQUIDITY ****

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        if (IPlotswapFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IPlotswapFactory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = PlotswapLibrary.getReserves(
            factory,
            tokenA,
            tokenB
        );
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = PlotswapLibrary.quote(
                amountADesired,
                reserveA,
                reserveB
            );
            if (amountBOptimal <= amountBDesired) {
                if (amountBOptimal < amountBMin)
                    revert PlotswapRouter__InsufficientBAmount();
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = PlotswapLibrary.quote(
                    amountBDesired,
                    reserveB,
                    reserveA
                );
                assert(amountAOptimal <= amountADesired);
                if (amountAOptimal < amountAMin)
                    revert PlotswapRouter__InsufficientAAmount();
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        (amountA, amountB) = _addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );
        address pair = PlotswapLibrary.pairFor(factory, tokenA, tokenB);

        // Check ERC-1404 restrictions
        _checkTransferRestriction(tokenA, msg.sender, pair, amountA);
        _checkTransferRestriction(tokenB, msg.sender, pair, amountB);

        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        liquidity = IPlotswapPair(pair).mint(to);

        emit XPAction(to, "add_liquidity", 150);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = PlotswapLibrary.pairFor(factory, tokenA, tokenB);

        // Check ERC-1404 restrictions for tokens leaving the pair
        _checkTransferRestriction(tokenA, pair, to, amountAMin);
        _checkTransferRestriction(tokenB, pair, to, amountBMin);

        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = IPlotswapPair(pair).burn(to);

        (address token0, ) = PlotswapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0
            ? (amount0, amount1)
            : (amount1, amount0);
        if (amountA < amountAMin) revert PlotswapRouter__InsufficientAAmount();
        if (amountB < amountBMin) revert PlotswapRouter__InsufficientBAmount();

        emit XPAction(msg.sender, "remove_liquidity", 50);
    }

    // **** SWAP ****

    function _swap(
        uint256[] memory amounts,
        address[] memory path,
        address _to
    ) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = PlotswapLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2
                ? PlotswapLibrary.pairFor(factory, output, path[i + 2])
                : _to;

            // Check ERC-1404 for output token
            address currentPair = PlotswapLibrary.pairFor(
                factory,
                input,
                output
            );
            _checkTransferRestriction(output, currentPair, to, amountOut);

            IPlotswapPair(currentPair).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = PlotswapLibrary.getAmountsOut(factory, amountIn, path);
        if (amounts[amounts.length - 1] < amountOutMin)
            revert PlotswapRouter__InsufficientOutputAmount();

        address firstPair = PlotswapLibrary.pairFor(
            factory,
            path[0],
            path[1]
        );

        // Check ERC-1404 for input token
        _checkTransferRestriction(path[0], msg.sender, firstPair, amounts[0]);

        IERC20(path[0]).safeTransferFrom(msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, to);

        _emitSwapXP(msg.sender);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = PlotswapLibrary.getAmountsIn(factory, amountOut, path);
        if (amounts[0] > amountInMax)
            revert PlotswapRouter__ExcessiveInputAmount();

        address firstPair = PlotswapLibrary.pairFor(
            factory,
            path[0],
            path[1]
        );

        _checkTransferRestriction(path[0], msg.sender, firstPair, amounts[0]);

        IERC20(path[0]).safeTransferFrom(msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, to);

        _emitSwapXP(msg.sender);
    }

    // **** LIBRARY FORWARDS ****

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256 amountB) {
        return PlotswapLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        return PlotswapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountIn) {
        return PlotswapLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) public view returns (uint256[] memory amounts) {
        return PlotswapLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(
        uint256 amountOut,
        address[] calldata path
    ) public view returns (uint256[] memory amounts) {
        return PlotswapLibrary.getAmountsIn(factory, amountOut, path);
    }

    // **** POOL INSPECTION (additive) ****

    function getPoolTokens(
        address pool
    ) external view returns (address token0, address token1) {
        token0 = IPlotswapPair(pool).token0();
        token1 = IPlotswapPair(pool).token1();
    }

    function getPoolReserves(
        address pool
    ) external view returns (uint112 reserve0, uint112 reserve1) {
        (reserve0, reserve1, ) = IPlotswapPair(pool).getReserves();
    }

    function getAllPoolsInfo() external view returns (PoolInfo[] memory pools) {
        uint256 len = IPlotswapFactory(factory).allPairsLength();
        pools = new PoolInfo[](len);
        for (uint256 i; i < len; i++) {
            address pool = IPlotswapFactory(factory).allPairs(i);
            (uint112 r0, uint112 r1, ) = IPlotswapPair(pool).getReserves();
            pools[i] = PoolInfo({
                pool: pool,
                token0: IPlotswapPair(pool).token0(),
                token1: IPlotswapPair(pool).token1(),
                reserve0: r0,
                reserve1: r1
            });
        }
    }

    // **** ROUTING / QUOTE HELPERS (additive) ****

    function bestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (address[] memory path, uint256 amountOut) {
        uint256 directOut;
        if (IPlotswapFactory(factory).getPair(tokenIn, tokenOut) != address(0)) {
            (uint256 rIn, uint256 rOut) = PlotswapLibrary.getReserves(
                factory,
                tokenIn,
                tokenOut
            );
            if (rIn > 0 && rOut > 0) {
                directOut = PlotswapLibrary.getAmountOut(amountIn, rIn, rOut);
            }
        }

        uint256 hopOut;
        if (tokenIn != WIRL && tokenOut != WIRL) {
            address firstHop = IPlotswapFactory(factory).getPair(tokenIn, WIRL);
            address secondHop = IPlotswapFactory(factory).getPair(
                WIRL,
                tokenOut
            );
            if (firstHop != address(0) && secondHop != address(0)) {
                (uint256 a1, uint256 a2) = PlotswapLibrary.getReserves(
                    factory,
                    tokenIn,
                    WIRL
                );
                (uint256 b1, uint256 b2) = PlotswapLibrary.getReserves(
                    factory,
                    WIRL,
                    tokenOut
                );
                if (a1 > 0 && a2 > 0 && b1 > 0 && b2 > 0) {
                    uint256 mid = PlotswapLibrary.getAmountOut(amountIn, a1, a2);
                    hopOut = PlotswapLibrary.getAmountOut(mid, b1, b2);
                }
            }
        }

        if (directOut >= hopOut && directOut > 0) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
            amountOut = directOut;
        } else if (hopOut > 0) {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = WIRL;
            path[2] = tokenOut;
            amountOut = hopOut;
        } else {
            path = new address[](0);
            amountOut = 0;
        }
    }

    function quoteWithSlippage(
        uint256 amountIn,
        address[] calldata path,
        uint256 slippageBps
    ) external view returns (uint256 amountOut, uint256 amountOutMin) {
        uint256[] memory amounts = PlotswapLibrary.getAmountsOut(
            factory,
            amountIn,
            path
        );
        amountOut = amounts[amounts.length - 1];
        amountOutMin = amountOut - (amountOut * slippageBps) / 10000;
    }

    // **** ERC-1404 PRE-FLIGHT (additive) ****

    function isWhitelistedForPair(
        address user,
        address pool
    ) external view returns (bool allowed, uint8 code, string memory message) {
        address token0 = IPlotswapPair(pool).token0();
        address token1 = IPlotswapPair(pool).token1();
        (allowed, code, message) = _preflight1404(token0, pool, user);
        if (!allowed) return (allowed, code, message);
        (allowed, code, message) = _preflight1404(token1, pool, user);
    }

    function _preflight1404(
        address token,
        address from,
        address to
    ) internal view returns (bool, uint8, string memory) {
        try IERC1404(token).detectTransferRestriction(from, to, 0) returns (
            uint8 c
        ) {
            if (c == 0) return (true, 0, "");
            try IERC1404(token).messageForTransferRestriction(c) returns (
                string memory m
            ) {
                return (false, c, m);
            } catch {
                return (false, c, "");
            }
        } catch {
            return (true, 0, "");
        }
    }

    // **** NATIVE IRL SWAP HELPERS (additive) ****

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256[] memory amounts) {
        if (path.length < 2 || path[0] != WIRL)
            revert PlotswapRouter__InvalidPath();
        amounts = PlotswapLibrary.getAmountsOut(factory, msg.value, path);
        if (amounts[amounts.length - 1] < amountOutMin)
            revert PlotswapRouter__InsufficientOutputAmount();

        address firstPair = PlotswapLibrary.pairFor(
            factory,
            path[0],
            path[1]
        );

        IWIRL(WIRL).deposit{value: amounts[0]}();
        IERC20(WIRL).safeTransfer(firstPair, amounts[0]);

        _swap(amounts, path, to);
        _emitSwapXP(msg.sender);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        if (path.length < 2 || path[path.length - 1] != WIRL)
            revert PlotswapRouter__InvalidPath();
        amounts = PlotswapLibrary.getAmountsOut(factory, amountIn, path);
        uint256 out = amounts[amounts.length - 1];
        if (out < amountOutMin)
            revert PlotswapRouter__InsufficientOutputAmount();

        address firstPair = PlotswapLibrary.pairFor(
            factory,
            path[0],
            path[1]
        );

        _checkTransferRestriction(path[0], msg.sender, firstPair, amounts[0]);

        IERC20(path[0]).safeTransferFrom(msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, address(this));
        IWIRL(WIRL).withdraw(out);

        (bool success, ) = to.call{value: out}("");
        if (!success) revert PlotswapRouter__EthTransferFailed();

        _emitSwapXP(msg.sender);
    }
}
