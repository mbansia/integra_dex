"use client";

import { useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { FACTORY_ABI } from "@/lib/abis/PlotswapFactory";
import { PAIR_ABI } from "@/lib/abis/PlotswapPair";
import { CONTRACTS } from "@/lib/contracts";

const NATIVE = "0x0000000000000000000000000000000000000000";
const WIRL = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34";

export interface PoolInfo {
  pair: `0x${string}`;
  token0: string;
  token1: string;
}

function normalize(addr: string | undefined): string {
  if (!addr) return "";
  const lower = addr.toLowerCase();
  return lower === NATIVE ? WIRL : lower;
}

export function useAllPools() {
  const { publicClient } = useWeb3();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!CONTRACTS.Factory || CONTRACTS.Factory === "0x") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const run = async () => {
      try {
        const pairCount = (await publicClient.readContract({
          address: CONTRACTS.Factory,
          abi: FACTORY_ABI,
          functionName: "allPairsLength",
        })) as bigint;

        const n = Math.min(Number(pairCount), 200);
        const indices = Array.from({ length: n }, (_, i) => BigInt(i));

        const pairAddrs = await Promise.all(
          indices.map((i) =>
            publicClient
              .readContract({
                address: CONTRACTS.Factory,
                abi: FACTORY_ABI,
                functionName: "allPairs",
                args: [i],
              })
              .catch(() => null),
          ),
        );

        const results = await Promise.all(
          pairAddrs.map(async (pair) => {
            if (!pair) return null;
            try {
              const [t0, t1] = await Promise.all([
                publicClient.readContract({ address: pair as `0x${string}`, abi: PAIR_ABI, functionName: "token0" }),
                publicClient.readContract({ address: pair as `0x${string}`, abi: PAIR_ABI, functionName: "token1" }),
              ]);
              return {
                pair: pair as `0x${string}`,
                token0: (t0 as string).toLowerCase(),
                token1: (t1 as string).toLowerCase(),
              } as PoolInfo;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) return;
        setPools(results.filter((p): p is PoolInfo => p !== null));
      } catch {
        if (!cancelled) setPools([]);
      }
      if (!cancelled) setIsLoading(false);
    };

    run();
    const interval = setInterval(run, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicClient]);

  return useMemo(() => {
    const tokensInPools = new Set<string>();
    const pairKeys = new Set<string>();
    for (const p of pools) {
      tokensInPools.add(p.token0);
      tokensInPools.add(p.token1);
      pairKeys.add(`${p.token0}|${p.token1}`);
      pairKeys.add(`${p.token1}|${p.token0}`);
    }
    const hasPair = (a: string | undefined, b: string | undefined): boolean => {
      const na = normalize(a);
      const nb = normalize(b);
      if (!na || !nb || na === nb) return false;
      return pairKeys.has(`${na}|${nb}`);
    };
    const hasPoolFor = (a: string | undefined): boolean => {
      const na = normalize(a);
      return na ? tokensInPools.has(na) : false;
    };
    const isSwapRoutable = (a: string | undefined, b: string | undefined): boolean => {
      const na = normalize(a);
      const nb = normalize(b);
      if (!na || !nb || na === nb) return false;
      if (hasPair(na, nb)) return true;
      // Two-hop via WIRL
      return hasPair(na, WIRL) && hasPair(nb, WIRL);
    };
    return { pools, isLoading, tokensInPools, hasPair, hasPoolFor, isSwapRoutable };
  }, [pools, isLoading]);
}
