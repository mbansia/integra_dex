"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { IRWA_WRAPPER_ABI } from "@/lib/abis/IRWAWrapper";
import { IRWA_TOKEN_ABI } from "@/lib/abis/IRWAToken";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";

export type IRWAMeta = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  passportURI: string;
};

export function useIRWATokens() {
  const { publicClient } = useWeb3();
  const [tokens, setTokens] = useState<IRWAMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = (await publicClient.readContract({
        address: CONTRACTS.IRWAWrapper,
        abi: IRWA_WRAPPER_ABI,
        functionName: "getAllTokens",
      })) as `0x${string}`[];

      const metas = await Promise.all(
        list.map(async (addr) => {
          try {
            const [name, symbol, decimals, totalSupply, passportURI] = await Promise.all([
              publicClient.readContract({ address: addr, abi: IRWA_TOKEN_ABI, functionName: "name" }),
              publicClient.readContract({ address: addr, abi: IRWA_TOKEN_ABI, functionName: "symbol" }),
              publicClient.readContract({ address: addr, abi: IRWA_TOKEN_ABI, functionName: "decimals" }),
              publicClient.readContract({ address: addr, abi: IRWA_TOKEN_ABI, functionName: "totalSupply" }),
              publicClient.readContract({ address: addr, abi: IRWA_TOKEN_ABI, functionName: "passportURI" }).catch(() => ""),
            ]);
            return {
              address: addr,
              name: name as string,
              symbol: symbol as string,
              decimals: Number(decimals),
              totalSupply: totalSupply as bigint,
              passportURI: passportURI as string,
            } as IRWAMeta;
          } catch {
            return null;
          }
        })
      );
      setTokens(metas.filter((m): m is IRWAMeta => m !== null));
    } catch (err) {
      console.error("[iRWA] getAllTokens failed:", err);
    }
    setIsLoading(false);
  }, [publicClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tokens, isLoading, refresh };
}

export function useIRWAWrapper() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastMinted, setLastMinted] = useState<`0x${string}` | null>(null);

  const mintNew = useCallback(
    async (name: string, symbol: string, supply: bigint, passportURI: string) => {
      if (!walletClient || !address) return null;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      setLastMinted(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.IRWAWrapper,
          abi: IRWA_WRAPPER_ABI,
          functionName: "mintNew",
          args: [name, symbol, supply, passportURI],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        const all = (await publicClient.readContract({
          address: CONTRACTS.IRWAWrapper,
          abi: IRWA_WRAPPER_ABI,
          functionName: "getAllTokens",
        })) as `0x${string}`[];
        const newToken = all[all.length - 1] ?? null;
        setLastMinted(newToken);
        setSuccess(`Minted iRWA ${symbol}`);
        return newToken;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Mint failed");
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const wrapERC20 = useCallback(
    async (
      token: `0x${string}`,
      amount: bigint,
      name: string,
      symbol: string,
      passportURI: string
    ) => {
      if (!walletClient || !address) return null;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const allowance = (await publicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, CONTRACTS.IRWAWrapper],
        })) as bigint;
        if (allowance < amount) {
          const approveHash = await walletClient.writeContract({
            address: token,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CONTRACTS.IRWAWrapper, maxUint256],
            account: address,
            chain: walletClient.chain,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        const hash = await walletClient.writeContract({
          address: CONTRACTS.IRWAWrapper,
          abi: IRWA_WRAPPER_ABI,
          functionName: "wrapERC20",
          args: [token, amount, name, symbol, passportURI],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess(`Wrapped ERC20 → ${symbol}`);
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Wrap failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const unwrap = useCallback(
    async (irwaToken: `0x${string}`) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.IRWAWrapper,
          abi: IRWA_WRAPPER_ABI,
          functionName: "unwrap",
          args: [irwaToken],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Unwrapped iRWA");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Unwrap failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  return { mintNew, wrapERC20, unwrap, isPending, error, success, lastMinted };
}
