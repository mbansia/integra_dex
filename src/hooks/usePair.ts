"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { FACTORY_ABI } from "@/lib/abis/PlotswapFactory";
import { PAIR_ABI } from "@/lib/abis/PlotswapPair";
import { CONTRACTS } from "@/lib/contracts";

export interface PairData {
  address: `0x${string}`;
  reserve0: bigint;
  reserve1: bigint;
  token0: `0x${string}`;
  token1: `0x${string}`;
  totalSupply: bigint;
  userLpBalance: bigint;
}

export function usePair(
  tokenA: `0x${string}` | undefined,
  tokenB: `0x${string}` | undefined
) {
  const { address, publicClient } = useWeb3();
  const [pair, setPair] = useState<PairData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tokenA || !tokenB || tokenA === "0x" || tokenB === "0x") {
      setPair(null);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const pairAddr = (await publicClient.readContract({
          address: CONTRACTS.Factory,
          abi: FACTORY_ABI,
          functionName: "getPair",
          args: [tokenA, tokenB],
        })) as `0x${string}`;

        if (pairAddr === "0x0000000000000000000000000000000000000000") {
          setPair(null);
          setIsLoading(false);
          return;
        }

        const [reserves, token0, token1, totalSupply] = await Promise.all([
          publicClient.readContract({
            address: pairAddr,
            abi: PAIR_ABI,
            functionName: "getReserves",
          }),
          publicClient.readContract({
            address: pairAddr,
            abi: PAIR_ABI,
            functionName: "token0",
          }),
          publicClient.readContract({
            address: pairAddr,
            abi: PAIR_ABI,
            functionName: "token1",
          }),
          publicClient.readContract({
            address: pairAddr,
            abi: PAIR_ABI,
            functionName: "totalSupply",
          }),
        ]);

        const [reserve0, reserve1] = reserves as [bigint, bigint, number];

        let userLpBalance = 0n;
        if (address) {
          userLpBalance = (await publicClient.readContract({
            address: pairAddr,
            abi: PAIR_ABI,
            functionName: "balanceOf",
            args: [address],
          })) as bigint;
        }

        setPair({
          address: pairAddr,
          reserve0,
          reserve1,
          token0: token0 as `0x${string}`,
          token1: token1 as `0x${string}`,
          totalSupply: totalSupply as bigint,
          userLpBalance,
        });
      } catch {
        setPair(null);
      }
      setIsLoading(false);
    };

    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [tokenA, tokenB, address, publicClient]);

  return { pair, isLoading };
}
