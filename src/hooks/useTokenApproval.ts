"use client";

import { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

export function useTokenApproval(tokenAddress: `0x${string}` | undefined) {
  const { address, walletClient, publicClient } = useWeb3();
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = tokenAddress === NATIVE_TOKEN;

  useEffect(() => {
    // Native token never needs approval
    if (isNative) {
      setAllowance(maxUint256);
      return;
    }
    if (!address || !tokenAddress || tokenAddress === "0x" || !CONTRACTS.Router || CONTRACTS.Router === "0x") {
      setAllowance(0n);
      return;
    }
    const fetch = async () => {
      try {
        const result = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, CONTRACTS.Router],
        });
        setAllowance(result as bigint);
      } catch (err) {
        console.error("[PlotSwap] Allowance check failed:", err);
        setAllowance(0n);
      }
    };
    fetch();
  }, [address, tokenAddress, isNative, publicClient]);

  const approve = useCallback(async () => {
    if (isNative) return; // Native token doesn't need approval
    if (!walletClient || !address || !tokenAddress) {
      setError("Wallet not connected");
      return;
    }
    if (!CONTRACTS.Router || CONTRACTS.Router === "0x") {
      setError("Router contract not configured");
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      console.log("[PlotSwap] Approving", tokenAddress, "for Router", CONTRACTS.Router);
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.Router, maxUint256],
        account: address,
        chain: walletClient.chain,
      });
      console.log("[PlotSwap] Approval tx:", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setAllowance(maxUint256);
      console.log("[PlotSwap] Approval confirmed");
    } catch (err: any) {
      console.error("[PlotSwap] Approval failed:", err);
      setError(err?.shortMessage || err?.message || "Approval failed");
    }
    setIsPending(false);
  }, [walletClient, address, tokenAddress, isNative, publicClient]);

  return { allowance, approve, isPending, error, isNative };
}
