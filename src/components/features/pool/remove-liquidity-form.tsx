"use client";

import { useState, useMemo } from "react";
import { useLiquidity } from "@/hooks/useLiquidity";
import { formatTokenAmount } from "@/lib/utils";
import type { PairData } from "@/hooks/usePair";
import type { TokenInfo } from "@/lib/token-list";

interface RemoveLiquidityFormProps {
  pair: PairData;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  onClose: () => void;
}

export function RemoveLiquidityForm({
  pair,
  tokenA,
  tokenB,
  onClose,
}: RemoveLiquidityFormProps) {
  const { removeLiquidity, isPending } = useLiquidity();
  const [percent, setPercent] = useState(50);

  const liquidityToRemove = useMemo(
    () => (pair.userLpBalance * BigInt(percent)) / 100n,
    [pair.userLpBalance, percent]
  );

  const amountAOut = useMemo(() => {
    if (pair.totalSupply === 0n) return 0n;
    const isToken0 =
      tokenA.address.toLowerCase() === pair.token0.toLowerCase();
    const reserve = isToken0 ? pair.reserve0 : pair.reserve1;
    return (liquidityToRemove * reserve) / pair.totalSupply;
  }, [liquidityToRemove, pair, tokenA]);

  const amountBOut = useMemo(() => {
    if (pair.totalSupply === 0n) return 0n;
    const isToken0 =
      tokenB.address.toLowerCase() === pair.token0.toLowerCase();
    const reserve = isToken0 ? pair.reserve0 : pair.reserve1;
    return (liquidityToRemove * reserve) / pair.totalSupply;
  }, [liquidityToRemove, pair, tokenB]);

  const handleRemove = async () => {
    await removeLiquidity(
      tokenA.address,
      tokenB.address,
      liquidityToRemove
    );
    onClose();
  };

  return (
    <div className="glass-card p-4 mt-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Remove Liquidity</h3>
        <button
          onClick={onClose}
          className="text-plotswap-text-muted hover:text-plotswap-text"
        >
          &times;
        </button>
      </div>

      <div className="text-center mb-4">
        <span className="text-4xl font-bold gradient-text">{percent}%</span>
      </div>

      <input
        type="range"
        min="1"
        max="100"
        value={percent}
        onChange={(e) => setPercent(Number(e.target.value))}
        className="w-full mb-4 accent-plotswap-primary"
      />

      <div className="flex gap-2 mb-4">
        {[25, 50, 75, 100].map((v) => (
          <button
            key={v}
            onClick={() => setPercent(v)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-plotswap-primary/10 transition-colors"
          >
            {v}%
          </button>
        ))}
      </div>

      <div className="glass-card-elevated p-3 space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-plotswap-text-muted">{tokenA.symbol}</span>
          <span className="font-mono">
            {formatTokenAmount(amountAOut, tokenA.decimals, 6)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-plotswap-text-muted">{tokenB.symbol}</span>
          <span className="font-mono">
            {formatTokenAmount(amountBOut, tokenB.decimals, 6)}
          </span>
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isPending || liquidityToRemove === 0n}
        className="btn-primary w-full py-3 text-sm"
      >
        {isPending ? "Removing..." : "Remove Liquidity"}
      </button>
    </div>
  );
}
