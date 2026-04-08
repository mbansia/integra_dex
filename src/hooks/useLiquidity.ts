"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ROUTER_ABI } from "@/lib/abis/PlotswapRouter";
import { CONTRACTS } from "@/lib/contracts";

export function useLiquidity() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLiquidity = useCallback(
    async (
      tokenA: `0x${string}`,
      tokenB: `0x${string}`,
      amountA: bigint,
      amountB: bigint,
      slippageBps: number = 50
    ) => {
      if (!walletClient || !address) return;
      setIsPending(true);
      setError(null);
      try {
        const amountAMin = amountA - (amountA * BigInt(slippageBps)) / 10000n;
        const amountBMin = amountB - (amountB * BigInt(slippageBps)) / 10000n;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

        const hash = await walletClient.writeContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "addLiquidity",
          args: [
            tokenA,
            tokenB,
            amountA,
            amountB,
            amountAMin,
            amountBMin,
            address,
            deadline,
          ],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err: any) {
        setError(err?.message?.includes("TransferRestricted")
          ? "Transfer restricted by token compliance"
          : "Failed to add liquidity");
        console.error("Add liquidity error:", err);
      }
      setIsPending(false);
    },
    [walletClient, address, publicClient]
  );

  const removeLiquidity = useCallback(
    async (
      tokenA: `0x${string}`,
      tokenB: `0x${string}`,
      liquidity: bigint,
      slippageBps: number = 50
    ) => {
      if (!walletClient || !address) return;
      setIsPending(true);
      setError(null);
      try {
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

        const hash = await walletClient.writeContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "removeLiquidity",
          args: [tokenA, tokenB, liquidity, 0n, 0n, address, deadline],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err: any) {
        setError("Failed to remove liquidity");
        console.error("Remove liquidity error:", err);
      }
      setIsPending(false);
    },
    [walletClient, address, publicClient]
  );

  return { addLiquidity, removeLiquidity, isPending, error };
}
