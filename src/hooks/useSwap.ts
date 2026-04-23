"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ROUTER_ABI } from "@/lib/abis/PlotswapRouter";
import { WIRL_ABI } from "@/lib/abis/WIRL";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { calculateMinimumReceived } from "@/lib/utils";
import { decodeError } from "@/lib/error-decoder";
import { recordXp } from "@/lib/xpkit";
import { maxUint256 } from "viem";

const NATIVE = "0x0000000000000000000000000000000000000000";
const WIRL = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;

// Swap native IRL address for WIRL in paths (Router works with ERC-20s)
function resolveAddress(addr: `0x${string}` | undefined): `0x${string}` | undefined {
  if (!addr) return addr;
  return addr === NATIVE ? WIRL : addr;
}

export function useSwap(
  tokenIn: `0x${string}` | undefined,
  tokenOut: `0x${string}` | undefined,
  amountIn: bigint
) {
  const effectiveIn = resolveAddress(tokenIn);
  const effectiveOut = resolveAddress(tokenOut);
  const { address, walletClient, publicClient } = useWeb3();
  const [amountOut, setAmountOut] = useState<bigint>(0n);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [xpOutcome, setXpOutcome] = useState<
    { variant: "earned" | "capped_daily" | "capped_total"; points?: number } | null
  >(null);
  const clearXpOutcome = useCallback(() => setXpOutcome(null), []);

  const awardXp = useCallback(
    async (hash: `0x${string}`, user: `0x${string}`, tIn: `0x${string}`, tOut: `0x${string}`, amtIn: bigint) => {
      try {
        const outcome = await recordXp(
          "swap_tokens",
          user,
          { txHash: hash, tokenIn: tIn, tokenOut: tOut, amountIn: amtIn.toString() },
          hash
        );
        if (outcome.ok && outcome.points > 0) {
          setXpOutcome({ variant: "earned", points: outcome.points });
        } else if (!outcome.ok && outcome.code === "DAILY_CAP_REACHED") {
          setXpOutcome({ variant: "capped_daily" });
        } else if (!outcome.ok && outcome.code === "TOTAL_CAP_REACHED") {
          setXpOutcome({ variant: "capped_total" });
        }
      } catch { /* ignore */ }
    },
    []
  );

  // Fetch quote
  useEffect(() => {
    if (
      !effectiveIn ||
      !effectiveOut ||
      effectiveIn === "0x" ||
      effectiveOut === "0x" ||
      amountIn === 0n
    ) {
      setAmountOut(0n);
      return;
    }

    const fetchQuote = async () => {
      setIsQuoting(true);
      setError(null);
      try {
        const result = await publicClient.readContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountIn, [effectiveIn, effectiveOut]],
        });
        const amounts = result as bigint[];
        setAmountOut(amounts[amounts.length - 1]);
      } catch (err: any) {
        setAmountOut(0n);
        if (err?.message?.includes("InsufficientLiquidity")) {
          setError("Insufficient liquidity for this trade");
        }
      }
      setIsQuoting(false);
    };

    const debounce = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounce);
  }, [effectiveIn, effectiveOut, amountIn, publicClient]);

  // Execute swap
  const swap = useCallback(
    async (slippageBps: number = 50) => {
      if (
        !walletClient ||
        !address ||
        !effectiveIn ||
        !effectiveOut ||
        amountIn === 0n ||
        amountOut === 0n
      )
        return;

      setIsSwapping(true);
      setError(null);
      setSuccess(false);
      setTxHash(null);
      let submittedHash: `0x${string}` | null = null;
      try {
        const minOut = calculateMinimumReceived(amountOut, slippageBps);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

        // Auto-wrap IRL → WIRL if input is native IRL
        if (tokenIn === NATIVE && effectiveIn === WIRL) {
          // Check WIRL balance
          const wirlBal = await publicClient.readContract({
            address: WIRL, abi: ERC20_ABI, functionName: "balanceOf", args: [address],
          }) as bigint;

          if (wirlBal < amountIn) {
            const wrapAmount = amountIn - wirlBal;
            console.log("[PlotSwap] Auto-wrapping", wrapAmount.toString(), "IRL → WIRL");
            const wrapHash = await walletClient.writeContract({
              address: WIRL, abi: WIRL_ABI, functionName: "deposit",
              value: wrapAmount, account: address, chain: walletClient.chain,
            });
            await publicClient.waitForTransactionReceipt({ hash: wrapHash });
          }

          // Check WIRL allowance for Router
          const allowance = await publicClient.readContract({
            address: WIRL, abi: ERC20_ABI, functionName: "allowance", args: [address, CONTRACTS.Router],
          }) as bigint;

          if (allowance < amountIn) {
            console.log("[PlotSwap] Auto-approving WIRL for Router");
            const approveHash = await walletClient.writeContract({
              address: WIRL, abi: ERC20_ABI, functionName: "approve",
              args: [CONTRACTS.Router, maxUint256], account: address, chain: walletClient.chain,
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
          }
        }

        console.log("[PlotSwap] Swap:", {
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          minOut: minOut.toString(),
          slippageBps,
          path: [effectiveIn, effectiveOut],
        });

        // Pre-flight simulate to catch revert reason
        try {
          await publicClient.simulateContract({
            address: CONTRACTS.Router,
            abi: ROUTER_ABI,
            functionName: "swapExactTokensForTokens",
            args: [amountIn, minOut, [effectiveIn, effectiveOut], address, deadline],
            account: address,
          });
        } catch (simErr: any) {
          console.error("[PlotSwap] Swap simulation failed:", simErr);
          const raw = simErr?.shortMessage || simErr?.message || "Unknown error";
          setError(decodeError(raw));
          setIsSwapping(false);
          return;
        }

        const hash = await walletClient.writeContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "swapExactTokensForTokens",
          args: [amountIn, minOut, [effectiveIn, effectiveOut], address, deadline],
          account: address,
          chain: walletClient.chain,
        });
        submittedHash = hash;
        setTxHash(hash);
        console.log("[PlotSwap] Swap tx submitted:", hash);

        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
          console.log("[PlotSwap] Swap receipt:", receipt.status);
          if (receipt.status === "reverted") {
            setError("Swap failed on-chain. Try increasing slippage or checking your balance.");
          } else {
            setSuccess(true);
            awardXp(hash, address, effectiveIn, effectiveOut, amountIn);
          }
        } catch (waitErr: any) {
          // Tx was submitted but we couldn't confirm it — assume success
          console.warn("[PlotSwap] Receipt wait failed, assuming tx is pending:", waitErr);
          setSuccess(true);
          awardXp(hash, address, effectiveIn, effectiveOut, amountIn);
        }
      } catch (err: any) {
        // Only show error if we didn't submit a hash
        if (submittedHash) {
          console.warn("[PlotSwap] Error after tx submit, assuming success:", err);
          setSuccess(true);
        } else {
          const raw = err?.shortMessage || err?.message || "Swap failed";
          setError(decodeError(raw));
          console.error("[PlotSwap] Swap error (pre-submit):", err);
        }
      }
      setIsSwapping(false);
    },
    [walletClient, address, effectiveIn, effectiveOut, amountIn, amountOut, publicClient, awardXp]
  );

  return { amountOut, isQuoting, isSwapping, error, success, txHash, swap, xpOutcome, clearXpOutcome };
}
