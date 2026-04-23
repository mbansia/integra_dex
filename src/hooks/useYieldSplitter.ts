"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { YIELD_SPLITTER_ABI } from "@/lib/abis/YieldSplitter";
import { IRWA_TOKEN_ABI } from "@/lib/abis/IRWAToken";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";

export type SplitAsset = {
  irwaToken: `0x${string}`;
  pt: `0x${string}`;
  yt: `0x${string}`;
  symbol: string;
  name: string;
};

export function useSplitAssets() {
  const { publicClient } = useWeb3();
  const [assets, setAssets] = useState<SplitAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = (await publicClient.readContract({
        address: CONTRACTS.YieldSplitter,
        abi: YIELD_SPLITTER_ABI,
        functionName: "getAllSplitAssets",
      })) as `0x${string}`[];

      const items = await Promise.all(
        list.map(async (irwaToken) => {
          try {
            const [pair, name, symbol] = await Promise.all([
              publicClient.readContract({
                address: CONTRACTS.YieldSplitter,
                abi: YIELD_SPLITTER_ABI,
                functionName: "getPairAddresses",
                args: [irwaToken],
              }) as Promise<[`0x${string}`, `0x${string}`]>,
              publicClient.readContract({ address: irwaToken, abi: IRWA_TOKEN_ABI, functionName: "name" }),
              publicClient.readContract({ address: irwaToken, abi: IRWA_TOKEN_ABI, functionName: "symbol" }),
            ]);
            return {
              irwaToken,
              pt: pair[0],
              yt: pair[1],
              name: name as string,
              symbol: symbol as string,
            } as SplitAsset;
          } catch {
            return null;
          }
        })
      );
      setAssets(items.filter((a): a is SplitAsset => a !== null));
    } catch (err) {
      console.error("[YieldSplitter] refresh failed:", err);
    }
    setIsLoading(false);
  }, [publicClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { assets, isLoading, refresh };
}

export function useAccruedYield(irwaToken: `0x${string}` | null) {
  const { address, publicClient } = useWeb3();
  const [amount, setAmount] = useState<bigint>(0n);

  const refresh = useCallback(async () => {
    if (!address || !irwaToken) {
      setAmount(0n);
      return;
    }
    try {
      const v = (await publicClient.readContract({
        address: CONTRACTS.YieldSplitter,
        abi: YIELD_SPLITTER_ABI,
        functionName: "getAccruedYield",
        args: [irwaToken, address],
      })) as bigint;
      setAmount(v);
    } catch {
      setAmount(0n);
    }
  }, [address, irwaToken, publicClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { amount, refresh };
}

export function useYieldSplitter() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const split = useCallback(
    async (irwaToken: `0x${string}`, amount: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const allowance = (await publicClient.readContract({
          address: irwaToken,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, CONTRACTS.YieldSplitter],
        })) as bigint;
        if (allowance < amount) {
          const approveHash = await walletClient.writeContract({
            address: irwaToken,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CONTRACTS.YieldSplitter, maxUint256],
            account: address,
            chain: walletClient.chain,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        const hash = await walletClient.writeContract({
          address: CONTRACTS.YieldSplitter,
          abi: YIELD_SPLITTER_ABI,
          functionName: "split",
          args: [irwaToken, amount],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Split into PT + YT");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Split failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const merge = useCallback(
    async (irwaToken: `0x${string}`, amount: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.YieldSplitter,
          abi: YIELD_SPLITTER_ABI,
          functionName: "merge",
          args: [irwaToken, amount],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Merged PT + YT back to iRWA");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Merge failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const claimYield = useCallback(
    async (irwaToken: `0x${string}`) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.YieldSplitter,
          abi: YIELD_SPLITTER_ABI,
          functionName: "claimYield",
          args: [irwaToken],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Yield claimed");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Claim failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  return { split, merge, claimYield, isPending, error, success };
}
