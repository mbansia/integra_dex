"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { FACTORY_ABI } from "@/lib/abis/PlotswapFactory";
import { PAIR_ABI } from "@/lib/abis/PlotswapPair";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import type { TokenInfo } from "@/lib/token-list";

const ERC1404_CHECK_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "detectTransferRestriction",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function isERC1404(
  publicClient: any,
  address: `0x${string}`
): Promise<boolean> {
  try {
    await publicClient.readContract({
      address,
      abi: ERC1404_CHECK_ABI,
      functionName: "detectTransferRestriction",
      args: [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        0n,
      ],
    });
    return true;
  } catch {
    return false;
  }
}

async function fetchTokenInfo(
  publicClient: any,
  address: `0x${string}`
): Promise<TokenInfo | null> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    // Fetch name separately (some tokens don't have it)
    let tokenName: string;
    try {
      tokenName = (await publicClient.readContract({
        address,
        abi: [
          {
            inputs: [],
            name: "name",
            outputs: [{ type: "string" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "name",
      })) as string;
    } catch {
      tokenName = symbol as string;
    }

    const is1404 = await isERC1404(publicClient, address);

    return {
      address,
      name: tokenName,
      symbol: symbol as string,
      decimals: Number(decimals),
      logoURI: "",
      isERC1404: is1404,
    };
  } catch {
    return null;
  }
}

export function useTokenList() {
  const { publicClient } = useWeb3();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!CONTRACTS.Factory || CONTRACTS.Factory === "0x") {
      setIsLoading(false);
      return;
    }

    const discover = async () => {
      setIsLoading(true);
      try {
        const pairCount = (await publicClient.readContract({
          address: CONTRACTS.Factory,
          abi: FACTORY_ABI,
          functionName: "allPairsLength",
        })) as bigint;

        const seenAddresses = new Set<string>();
        const tokenAddresses: `0x${string}`[] = [];

        // Fetch all pairs and collect unique token addresses
        for (let i = 0; i < Number(pairCount) && i < 50; i++) {
          try {
            const pairAddr = (await publicClient.readContract({
              address: CONTRACTS.Factory,
              abi: FACTORY_ABI,
              functionName: "allPairs",
              args: [BigInt(i)],
            })) as `0x${string}`;

            const [token0, token1] = await Promise.all([
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
            ]);

            for (const addr of [token0, token1] as `0x${string}`[]) {
              const key = addr.toLowerCase();
              if (!seenAddresses.has(key)) {
                seenAddresses.add(key);
                tokenAddresses.push(addr);
              }
            }
          } catch {
            continue;
          }
        }

        // Fetch metadata for all discovered tokens
        const tokenInfos = await Promise.all(
          tokenAddresses.map((addr) => fetchTokenInfo(publicClient, addr))
        );

        setTokens(tokenInfos.filter((t): t is TokenInfo => t !== null));
      } catch (err) {
        console.error("Token discovery error:", err);
      }
      setIsLoading(false);
    };

    discover();
    const interval = setInterval(discover, 60000);
    return () => clearInterval(interval);
  }, [publicClient]);

  return { tokens, isLoading };
}
