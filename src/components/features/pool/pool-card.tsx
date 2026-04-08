"use client";

import { useState } from "react";
import { formatTokenAmount } from "@/lib/utils";
import { RemoveLiquidityForm } from "./remove-liquidity-form";
import type { PairData } from "@/hooks/usePair";
import type { TokenInfo } from "@/lib/token-list";

interface PoolCardProps {
  pair: PairData;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
}

export function PoolCard({ pair, tokenA, tokenB }: PoolCardProps) {
  const [showRemove, setShowRemove] = useState(false);

  const sharePercent =
    pair.totalSupply > 0n
      ? Number((pair.userLpBalance * 10000n) / pair.totalSupply) / 100
      : 0;

  const isToken0A =
    tokenA.address.toLowerCase() === pair.token0.toLowerCase();
  const reserveA = isToken0A ? pair.reserve0 : pair.reserve1;
  const reserveB = isToken0A ? pair.reserve1 : pair.reserve0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-[10px] font-bold text-plotswap-primary-light border-2 border-plotswap-bg">
              {tokenA.symbol.slice(0, 2)}
            </div>
            <div className="w-8 h-8 rounded-full bg-plotswap-accent/20 flex items-center justify-center text-[10px] font-bold text-plotswap-accent border-2 border-plotswap-bg">
              {tokenB.symbol.slice(0, 2)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm">
              {tokenA.symbol} / {tokenB.symbol}
            </div>
            <div className="text-xs text-plotswap-text-muted">
              Pool share: {sharePercent.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-plotswap-text-muted">
          <div>
            {formatTokenAmount(reserveA, tokenA.decimals, 2)} {tokenA.symbol}
          </div>
          <div>
            {formatTokenAmount(reserveB, tokenB.decimals, 2)} {tokenB.symbol}
          </div>
        </div>
      </div>

      {pair.userLpBalance > 0n && (
        <div className="mt-3 pt-3 border-t border-plotswap-border">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-plotswap-text-muted">Your LP tokens</span>
            <span className="font-mono">
              {formatTokenAmount(pair.userLpBalance, 18, 6)}
            </span>
          </div>
          <button
            onClick={() => setShowRemove(!showRemove)}
            className="text-xs text-plotswap-primary-light hover:text-plotswap-primary transition-colors"
          >
            {showRemove ? "Cancel" : "Remove Liquidity"}
          </button>
        </div>
      )}

      {showRemove && (
        <RemoveLiquidityForm
          pair={pair}
          tokenA={tokenA}
          tokenB={tokenB}
          onClose={() => setShowRemove(false)}
        />
      )}
    </div>
  );
}
