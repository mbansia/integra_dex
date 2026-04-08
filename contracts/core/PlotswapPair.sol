// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IPlotswapPair.sol";
import "../interfaces/IPlotswapFactory.sol";
import "../libraries/UQ112x112.sol";
import "../libraries/Math.sol";

contract PlotswapPair is ERC20 {
    using UQ112x112 for uint224;
    using SafeERC20 for IERC20;

    error PlotswapPair__Locked();
    error PlotswapPair__Forbidden();
    error PlotswapPair__Overflow();
    error PlotswapPair__InsufficientLiquidityMinted();
    error PlotswapPair__InsufficientLiquidityBurned();
    error PlotswapPair__InsufficientOutputAmount();
    error PlotswapPair__InsufficientInputAmount();
    error PlotswapPair__InsufficientLiquidity();
    error PlotswapPair__InvalidTo();
    error PlotswapPair__KInvariant();

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        address indexed to
    );
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public factory;
    address public token0;
    address public token1;

    uint112 private _reserve0;
    uint112 private _reserve1;
    uint32 private _blockTimestampLast;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint256 public kLast;

    uint256 private _unlocked = 1;

    modifier lock() {
        if (_unlocked != 1) revert PlotswapPair__Locked();
        _unlocked = 0;
        _;
        _unlocked = 1;
    }

    constructor() ERC20("PlotSwap LP", "PLOT-LP") {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        if (msg.sender != factory) revert PlotswapPair__Forbidden();
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves()
        public
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
    {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        blockTimestampLast = _blockTimestampLast;
    }

    function _update(
        uint256 balance0,
        uint256 balance1,
        uint112 reserve0,
        uint112 reserve1
    ) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max)
            revert PlotswapPair__Overflow();

        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        unchecked {
            uint32 timeElapsed = blockTimestamp - _blockTimestampLast;
            if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0) {
                price0CumulativeLast +=
                    uint256(UQ112x112.encode(reserve1).uqdiv(reserve0)) *
                    timeElapsed;
                price1CumulativeLast +=
                    uint256(UQ112x112.encode(reserve0).uqdiv(reserve1)) *
                    timeElapsed;
            }
        }

        _reserve0 = uint112(balance0);
        _reserve1 = uint112(balance1);
        _blockTimestampLast = blockTimestamp;
        emit Sync(uint112(balance0), uint112(balance1));
    }

    function _mintFee(
        uint112 reserve0,
        uint112 reserve1
    ) private returns (bool feeOn) {
        address feeTo = IPlotswapFactory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint256 _kLast = kLast;
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(
                    uint256(reserve0) * uint256(reserve1)
                );
                uint256 rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = totalSupply() * (rootK - rootKLast);
                    uint256 denominator = rootK * 5 + rootKLast;
                    uint256 liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    function mint(address to) external lock returns (uint256 liquidity) {
        (uint112 reserve0, uint112 reserve1, ) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - reserve0;
        uint256 amount1 = balance1 - reserve1;

        bool feeOn = _mintFee(reserve0, reserve1);
        uint256 _totalSupply = totalSupply();

        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amount0 * _totalSupply) / reserve0,
                (amount1 * _totalSupply) / reserve1
            );
        }
        if (liquidity == 0) revert PlotswapPair__InsufficientLiquidityMinted();

        _mint(to, liquidity);
        _update(balance0, balance1, reserve0, reserve1);
        if (feeOn) kLast = uint256(_reserve0) * uint256(_reserve1);
        emit Mint(msg.sender, amount0, amount1);
    }

    function burn(
        address to
    ) external lock returns (uint256 amount0, uint256 amount1) {
        (uint112 reserve0, uint112 reserve1, ) = getReserves();
        address _token0 = token0;
        address _token1 = token1;
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        bool feeOn = _mintFee(reserve0, reserve1);
        uint256 _totalSupply = totalSupply();

        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;
        if (amount0 == 0 || amount1 == 0)
            revert PlotswapPair__InsufficientLiquidityBurned();

        _burn(address(this), liquidity);
        IERC20(_token0).safeTransfer(to, amount0);
        IERC20(_token1).safeTransfer(to, amount1);

        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, reserve0, reserve1);
        if (feeOn) kLast = uint256(_reserve0) * uint256(_reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata
    ) external lock {
        if (amount0Out == 0 && amount1Out == 0)
            revert PlotswapPair__InsufficientOutputAmount();

        (uint112 reserve0, uint112 reserve1, ) = getReserves();
        if (amount0Out >= reserve0 || amount1Out >= reserve1)
            revert PlotswapPair__InsufficientLiquidity();

        uint256 balance0;
        uint256 balance1;
        {
            address _token0 = token0;
            address _token1 = token1;
            if (to == _token0 || to == _token1)
                revert PlotswapPair__InvalidTo();
            if (amount0Out > 0) IERC20(_token0).safeTransfer(to, amount0Out);
            if (amount1Out > 0) IERC20(_token1).safeTransfer(to, amount1Out);
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }

        uint256 amount0In = balance0 > reserve0 - amount0Out
            ? balance0 - (reserve0 - amount0Out)
            : 0;
        uint256 amount1In = balance1 > reserve1 - amount1Out
            ? balance1 - (reserve1 - amount1Out)
            : 0;
        if (amount0In == 0 && amount1In == 0)
            revert PlotswapPair__InsufficientInputAmount();

        {
            uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
            uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;
            if (
                balance0Adjusted * balance1Adjusted <
                uint256(reserve0) * uint256(reserve1) * 1000 ** 2
            ) revert PlotswapPair__KInvariant();
        }

        _update(balance0, balance1, reserve0, reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function skim(address to) external lock {
        address _token0 = token0;
        address _token1 = token1;
        IERC20(_token0).safeTransfer(
            to,
            IERC20(_token0).balanceOf(address(this)) - _reserve0
        );
        IERC20(_token1).safeTransfer(
            to,
            IERC20(_token1).balanceOf(address(this)) - _reserve1
        );
    }

    function sync() external lock {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            _reserve0,
            _reserve1
        );
    }
}
