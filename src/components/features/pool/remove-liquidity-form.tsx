"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useLiquidity } from "@/hooks/useLiquidity";
import { formatTokenAmount } from "@/lib/utils";
import { PAIR_ABI } from "@/lib/abis/PlotswapPair";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";
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
  const { address, walletClient, publicClient } = useWeb3();
  const { removeLiquidity, isPending, error, success } = useLiquidity();
  const [percent, setPercent] = useState(50);
  const [lpAllowance, setLpAllowance] = useState<bigint>(0n);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const liquidityToRemove = useMemo(
    () => (pair.userLpBalance * BigInt(percent)) / 100n,
    [pair.userLpBalance, percent]
  );

  const needsApproval = liquidityToRemove > 0n && lpAllowance < liquidityToRemove;

  // Fetch LP token allowance
  useEffect(() => {
    if (!address) return;
    const fetch = async () => {
      try {
        const result = await publicClient.readContract({
          address: pair.address,
          abi: PAIR_ABI,
          functionName: "allowance",
          args: [address, CONTRACTS.Router],
        });
        setLpAllowance(result as bigint);
      } catch {
        setLpAllowance(0n);
      }
    };
    fetch();
  }, [address, pair.address, publicClient, isApproving]);

  const handleApprove = useCallback(async () => {
    if (!walletClient || !address) return;
    setIsApproving(true);
    setApproveError(null);
    try {
      const hash = await walletClient.writeContract({
        address: pair.address,
        abi: PAIR_ABI,
        functionName: "approve",
        args: [CONTRACTS.Router, maxUint256],
        account: address,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setLpAllowance(maxUint256);
    } catch (err: any) {
      setApproveError(err?.shortMessage || "LP approval failed");
    }
    setIsApproving(false);
  }, [walletClient, address, pair.address, publicClient]);

  const amountAOut = useMemo(() => {
    if (pair.totalSupply === 0n) return 0n;
    const isToken0 = tokenA.address.toLowerCase() === pair.token0.toLowerCase();
    const reserve = isToken0 ? pair.reserve0 : pair.reserve1;
    return (liquidityToRemove * reserve) / pair.totalSupply;
  }, [liquidityToRemove, pair, tokenA]);

  const amountBOut = useMemo(() => {
    if (pair.totalSupply === 0n) return 0n;
    const isToken0 = tokenB.address.toLowerCase() === pair.token0.toLowerCase();
    const reserve = isToken0 ? pair.reserve0 : pair.reserve1;
    return (liquidityToRemove * reserve) / pair.totalSupply;
  }, [liquidityToRemove, pair, tokenB]);

  const handleRemove = async () => {
    await removeLiquidity(tokenA.address, tokenB.address, liquidityToRemove);
  };

  return (
    <div className="glass-card p-4 mt-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-plotswap-text">Remove Liquidity</h3>
        <button onClick={onClose} className="text-plotswap-text-muted hover:text-plotswap-text">&times;</button>
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
            className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-plotswap-primary/5 hover:bg-plotswap-primary/10 text-plotswap-text-muted transition-colors"
          >
            {v}%
          </button>
        ))}
      </div>

      <div className="glass-card-elevated p-3 space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-plotswap-text-muted">{tokenA.symbol}</span>
          <span className="font-mono text-plotswap-text">{formatTokenAmount(amountAOut, tokenA.decimals, 6)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-plotswap-text-muted">{tokenB.symbol}</span>
          <span className="font-mono text-plotswap-text">{formatTokenAmount(amountBOut, tokenB.decimals, 6)}</span>
        </div>
      </div>

      {(error || approveError) && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
          {error || approveError}
        </div>
      )}

      {success && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-success/10 border border-plotswap-success/20 text-plotswap-success text-xs">
          Liquidity removed successfully!
        </div>
      )}

      {needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="btn-primary w-full py-3 text-sm"
        >
          {isApproving ? "Approving LP tokens..." : "Approve LP Tokens"}
        </button>
      ) : (
        <button
          onClick={handleRemove}
          disabled={isPending || liquidityToRemove === 0n || success}
          className="btn-primary w-full py-3 text-sm"
        >
          {isPending ? "Removing..." : "Remove Liquidity"}
        </button>
      )}
    </div>
  );
}
