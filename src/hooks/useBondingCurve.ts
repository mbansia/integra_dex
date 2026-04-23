"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { BONDING_CURVE_LAUNCHER_ABI } from "@/lib/abis/BondingCurveLauncher";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";

const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export type Launch = {
  launchId: bigint;
  creator: `0x${string}`;
  token: `0x${string}`;
  paymentToken: `0x${string}`;
  curveType: number;
  base: bigint;
  slope: bigint;
  supplyCap: bigint;
  graduationThreshold: bigint;
  reserve: bigint;
  sold: bigint;
  graduated: boolean;
  raw: any;
};

function toLaunch(id: bigint, tuple: any): Launch {
  // Order derived from createLaunch args + common fields; adapt if contract returns differ
  return {
    launchId: id,
    creator: (tuple.creator ?? tuple[0]) as `0x${string}`,
    token: (tuple.token ?? tuple[1]) as `0x${string}`,
    paymentToken: (tuple.paymentToken ?? tuple[2]) as `0x${string}`,
    curveType: Number(tuple.curveType ?? tuple[3] ?? 0),
    base: tuple.base ?? tuple[4] ?? 0n,
    slope: tuple.slope ?? tuple[5] ?? 0n,
    supplyCap: tuple.supplyCap ?? tuple[6] ?? 0n,
    graduationThreshold: tuple.graduationThreshold ?? tuple[7] ?? 0n,
    reserve: tuple.reserve ?? tuple[8] ?? 0n,
    sold: tuple.sold ?? tuple[9] ?? 0n,
    graduated: Boolean(tuple.graduated ?? tuple[10] ?? false),
    raw: tuple,
  };
}

export function useLaunches() {
  const { publicClient } = useWeb3();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const ids = (await publicClient.readContract({
        address: CONTRACTS.BondingCurveLauncher,
        abi: BONDING_CURVE_LAUNCHER_ABI,
        functionName: "getAllLaunchIds",
      })) as bigint[];

      const items = await Promise.all(
        ids.map(async (id) => {
          try {
            const tuple = await publicClient.readContract({
              address: CONTRACTS.BondingCurveLauncher,
              abi: BONDING_CURVE_LAUNCHER_ABI,
              functionName: "getLaunch",
              args: [id],
            });
            return toLaunch(id, tuple);
          } catch {
            return null;
          }
        })
      );
      setLaunches(items.filter((l): l is Launch => l !== null));
    } catch (err) {
      console.error("[BondingCurve] refresh failed:", err);
    }
    setIsLoading(false);
  }, [publicClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { launches, isLoading, refresh };
}

export function useBondingCurveQuote(
  launchId: bigint | null,
  amount: bigint,
  mode: "buy" | "sell"
) {
  const { publicClient } = useWeb3();
  const [cost, setCost] = useState<bigint>(0n);
  const [newPrice, setNewPrice] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (launchId === null || amount === 0n) {
      setCost(0n);
      setNewPrice(0n);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [c, p] = (await publicClient.readContract({
          address: CONTRACTS.BondingCurveLauncher,
          abi: BONDING_CURVE_LAUNCHER_ABI,
          functionName: mode === "buy" ? "quoteBuy" : "quoteSell",
          args: [launchId, amount],
        })) as [bigint, bigint];
        if (!cancelled) {
          setCost(c);
          setNewPrice(p);
        }
      } catch {
        if (!cancelled) {
          setCost(0n);
          setNewPrice(0n);
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [launchId, amount, mode, publicClient]);

  return { cost, newPrice, isLoading };
}

export function useBondingCurve() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createLaunch = useCallback(
    async (
      token: `0x${string}`,
      paymentToken: `0x${string}`,
      curveType: number,
      base: bigint,
      slope: bigint,
      supplyCap: bigint,
      graduationThreshold: bigint
    ) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.BondingCurveLauncher,
          abi: BONDING_CURVE_LAUNCHER_ABI,
          functionName: "createLaunch",
          args: [token, paymentToken, curveType, base, slope, supplyCap, graduationThreshold],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Launch created");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Create failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const buy = useCallback(
    async (launch: Launch, amount: bigint, maxCost: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const payingNative = launch.paymentToken === NATIVE;
        if (!payingNative) {
          const allowance = (await publicClient.readContract({
            address: launch.paymentToken,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, CONTRACTS.BondingCurveLauncher],
          })) as bigint;
          if (allowance < maxCost) {
            const approveHash = await walletClient.writeContract({
              address: launch.paymentToken,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [CONTRACTS.BondingCurveLauncher, maxUint256],
              account: address,
              chain: walletClient.chain,
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
          }
        }

        const hash = await walletClient.writeContract({
          address: CONTRACTS.BondingCurveLauncher,
          abi: BONDING_CURVE_LAUNCHER_ABI,
          functionName: "buy",
          args: [launch.launchId, amount, maxCost],
          value: payingNative ? maxCost : 0n,
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Bought");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Buy failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const sell = useCallback(
    async (launchId: bigint, amount: bigint, minRefund: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.BondingCurveLauncher,
          abi: BONDING_CURVE_LAUNCHER_ABI,
          functionName: "sell",
          args: [launchId, amount, minRefund],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Sold");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Sell failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const graduate = useCallback(
    async (launchId: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.BondingCurveLauncher,
          abi: BONDING_CURVE_LAUNCHER_ABI,
          functionName: "graduate",
          args: [launchId],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Graduated to orderbook");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Graduation failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  return { createLaunch, buy, sell, graduate, isPending, error, success };
}
