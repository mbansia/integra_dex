"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ROUTER_ABI } from "@/lib/abis/PlotswapRouter";
import { CONTRACTS } from "@/lib/contracts";
import { calculateMinimumReceived } from "@/lib/utils";

export function useSwap(
  tokenIn: `0x${string}` | undefined,
  tokenOut: `0x${string}` | undefined,
  amountIn: bigint
) {
  const { address, walletClient, publicClient } = useWeb3();
  const [amountOut, setAmountOut] = useState<bigint>(0n);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quote
  useEffect(() => {
    if (
      !tokenIn ||
      !tokenOut ||
      tokenIn === "0x" ||
      tokenOut === "0x" ||
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
          args: [amountIn, [tokenIn, tokenOut]],
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
  }, [tokenIn, tokenOut, amountIn, publicClient]);

  // Execute swap
  const swap = useCallback(
    async (slippageBps: number = 50) => {
      if (
        !walletClient ||
        !address ||
        !tokenIn ||
        !tokenOut ||
        amountIn === 0n ||
        amountOut === 0n
      )
        return;

      setIsSwapping(true);
      setError(null);
      try {
        const minOut = calculateMinimumReceived(amountOut, slippageBps);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min

        const hash = await walletClient.writeContract({
          address: CONTRACTS.Router,
          abi: ROUTER_ABI,
          functionName: "swapExactTokensForTokens",
          args: [amountIn, minOut, [tokenIn, tokenOut], address, deadline],
          account: address,
          chain: walletClient.chain,
        });

        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err: any) {
        const msg =
          err?.message?.includes("TransferRestricted")
            ? "Transfer restricted: token compliance check failed"
            : err?.message?.includes("InsufficientOutputAmount")
              ? "Price moved — try increasing slippage"
              : "Swap failed";
        setError(msg);
        console.error("Swap error:", err);
      }
      setIsSwapping(false);
    },
    [walletClient, address, tokenIn, tokenOut, amountIn, amountOut, publicClient]
  );

  return { amountOut, isQuoting, isSwapping, error, swap };
}
