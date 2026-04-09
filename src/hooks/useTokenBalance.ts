"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ERC20_ABI } from "@/lib/abis/ERC20";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address, publicClient } = useWeb3();
  const [balance, setBalance] = useState<bigint>(0n);

  useEffect(() => {
    if (!address || !tokenAddress || tokenAddress === "0x") {
      setBalance(0n);
      return;
    }

    const fetchBalance = async () => {
      try {
        if (tokenAddress === NATIVE_TOKEN) {
          // Native token (IRL) — use getBalance
          const bal = await publicClient.getBalance({ address });
          setBalance(bal);
        } else {
          // ERC-20 token — use balanceOf
          const bal = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          });
          setBalance(bal as bigint);
        }
      } catch {
        setBalance(0n);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address, tokenAddress, publicClient]);

  return balance;
}
