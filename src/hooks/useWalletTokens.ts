"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import type { TokenInfo } from "@/lib/token-list";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const CHUNK_SIZE = 10000n;
const MAX_CHUNKS = 30; // ~300k blocks back

function addressToTopic(addr: `0x${string}`): `0x${string}` {
  return `0x${"0".repeat(24)}${addr.slice(2).toLowerCase()}` as `0x${string}`;
}

async function fetchTokenMeta(publicClient: any, addr: `0x${string}`): Promise<TokenInfo | null> {
  try {
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }),
      publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    let name: string;
    try {
      name = (await publicClient.readContract({
        address: addr,
        abi: [{ inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" }],
        functionName: "name",
      })) as string;
    } catch { name = symbol as string; }

    let isERC1404 = false;
    try {
      await publicClient.readContract({
        address: addr,
        abi: [{ inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "detectTransferRestriction", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
        functionName: "detectTransferRestriction",
        args: ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", 0n],
      });
      isERC1404 = true;
    } catch { isERC1404 = false; }

    return { address: addr, name, symbol: symbol as string, decimals: Number(decimals), logoURI: "", isERC1404 };
  } catch {
    return null;
  }
}

export function useWalletTokens() {
  const { address, publicClient } = useWeb3();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!address) {
      setTokens([]);
      return;
    }

    let cancelled = false;

    const scan = async () => {
      setIsScanning(true);
      setProgress(0);
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const userTopic = addressToTopic(address);
        const uniqueTokens = new Set<string>();

        // Scan recent blocks in chunks for Transfer events where user is sender or receiver
        for (let i = 0; i < MAX_CHUNKS; i++) {
          if (cancelled) break;
          const toBlock = latestBlock - BigInt(i) * CHUNK_SIZE;
          const fromBlock = toBlock - CHUNK_SIZE + 1n;
          if (fromBlock < 0n) break;

          try {
            // Transfers TO user
            const logsTo = await publicClient.getLogs({
              fromBlock,
              toBlock,
              topics: [TRANSFER_TOPIC, null, userTopic],
            });
            // Transfers FROM user
            const logsFrom = await publicClient.getLogs({
              fromBlock,
              toBlock,
              topics: [TRANSFER_TOPIC, userTopic],
            });

            [...logsTo, ...logsFrom].forEach((log) => {
              uniqueTokens.add(log.address.toLowerCase());
            });
          } catch {
            // Skip chunks that fail
          }

          setProgress(Math.round(((i + 1) / MAX_CHUNKS) * 100));
        }

        if (cancelled) return;

        // Fetch metadata for unique tokens
        const tokenAddrs = Array.from(uniqueTokens) as `0x${string}`[];
        const metas = await Promise.all(tokenAddrs.map((a) => fetchTokenMeta(publicClient, a)));
        const validTokens = metas.filter((t): t is TokenInfo => t !== null);

        if (!cancelled) setTokens(validTokens);
      } catch (err) {
        console.error("[PlotSwap] Wallet token scan error:", err);
      }
      if (!cancelled) setIsScanning(false);
    };

    scan();
    return () => { cancelled = true; };
  }, [address, publicClient]);

  return { tokens, isScanning, progress };
}
