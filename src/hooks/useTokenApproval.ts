"use client";

import { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";

export function useTokenApproval(tokenAddress: `0x${string}` | undefined) {
  const { address, walletClient, publicClient } = useWeb3();
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!address || !tokenAddress || tokenAddress === "0x") {
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
      } catch {
        setAllowance(0n);
      }
    };
    fetch();
  }, [address, tokenAddress, publicClient]);

  const approve = useCallback(async () => {
    if (!walletClient || !address || !tokenAddress) return;
    setIsPending(true);
    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.Router, maxUint256],
        account: address,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setAllowance(maxUint256);
    } catch (err) {
      console.error("Approval failed:", err);
    }
    setIsPending(false);
  }, [walletClient, address, tokenAddress, publicClient]);

  return { allowance, approve, isPending };
}
