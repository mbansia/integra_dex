"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ROUTER_ABI } from "@/lib/abis/PlotswapRouter";
import { CONTRACTS } from "@/lib/contracts";
import { decodeError } from "@/lib/error-decoder";

const NATIVE = "0x0000000000000000000000000000000000000000";
const WIRL = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;

function resolveAddr(addr: `0x${string}`): `0x${string}` {
  return addr === NATIVE ? WIRL : addr;
}

export function useLiquidity() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setSuccess(false);

      const resolvedA = resolveAddr(tokenA);
      const resolvedB = resolveAddr(tokenB);

      try {
        // Use 0 minimums to handle pools with dust reserves or new pools
        // The Router's _addLiquidity already computes optimal amounts
        const amountAMin = 0n;
        const amountBMin = 0n;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

        console.log("[PlotSwap] Adding liquidity:", {
          tokenA: resolvedA, tokenB: resolvedB,
          amountA: amountA.toString(), amountB: amountB.toString(),
          amountAMin: amountAMin.toString(), amountBMin: amountBMin.toString(),
          router: CONTRACTS.Router, to: address, deadline: deadline.toString(),
        });

        // Pre-flight: simulate the call to get revert reason
        try {
          await publicClient.simulateContract({
            address: CONTRACTS.Router,
            abi: ROUTER_ABI,
            functionName: "addLiquidity",
            args: [resolvedA, resolvedB, amountA, amountB, amountAMin, amountBMin, address, deadline],
            account: address,
          });
        } catch (simErr: any) {
          console.error("[PlotSwap] Simulation failed:", simErr);
          const raw = simErr?.shortMessage || simErr?.message || "Unknown error";
          setError(decodeError(raw));
          setIsPending(false);
          return;
        }

        const hash = await walletClient.writeContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "addLiquidity",
          args: [
            resolvedA,
            resolvedB,
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
        console.log("[PlotSwap] Liquidity tx:", hash);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[PlotSwap] Liquidity tx status:", receipt.status);
        if (receipt.status === "reverted") {
          setError("Transaction failed on-chain. Make sure you have enough tokens and approvals.");
        } else {
          console.log("[PlotSwap] Liquidity added successfully");
          setSuccess(true);
        }
      } catch (err: any) {
        console.error("[PlotSwap] Add liquidity error:", err);
        const raw = err?.shortMessage || err?.message || "Failed to add liquidity";
        setError(decodeError(raw));
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
      setSuccess(false);

      const resolvedA = resolveAddr(tokenA);
      const resolvedB = resolveAddr(tokenB);

      try {
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

        const hash = await walletClient.writeContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "removeLiquidity",
          args: [resolvedA, resolvedB, liquidity, 0n, 0n, address, deadline],
          account: address,
          chain: walletClient.chain,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "reverted") {
          setError("Transaction reverted on-chain.");
        } else {
          setSuccess(true);
        }
      } catch (err: any) {
        console.error("[PlotSwap] Remove liquidity error:", err);
        setError(decodeError(err?.shortMessage || err?.message || "Failed to remove liquidity"));
      }
      setIsPending(false);
    },
    [walletClient, address, publicClient]
  );

  return { addLiquidity, removeLiquidity, isPending, error, success };
}
