"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { FACTORY_ABI } from "@/lib/abis/PlotswapFactory";
import { PAIR_ABI } from "@/lib/abis/PlotswapPair";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { formatTokenAmount } from "@/lib/utils";
interface PoolInfo {
  address: `0x${string}`;
  token0: { address: `0x${string}`; symbol: string; decimals: number };
  token1: { address: `0x${string}`; symbol: string; decimals: number };
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  userLpBalance: bigint;
}

async function fetchTokenMeta(publicClient: any, addr: `0x${string}`) {
  try {
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }),
      publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    return { address: addr, symbol: symbol as string, decimals: Number(decimals) };
  } catch {
    return { address: addr, symbol: addr.slice(0, 6), decimals: 18 };
  }
}

export function ExistingPools({ onManage }: { onManage?: () => void }) {
  const { publicClient, address } = useWeb3();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!CONTRACTS.Factory || CONTRACTS.Factory === "0x") {
      setIsLoading(false);
      return;
    }

    const fetchPools = async () => {
      setIsLoading(true);
      try {
        const count = (await publicClient.readContract({
          address: CONTRACTS.Factory,
          abi: FACTORY_ABI,
          functionName: "allPairsLength",
        })) as bigint;

        const poolList: PoolInfo[] = [];

        for (let i = 0; i < Number(count) && i < 50; i++) {
          try {
            const pairAddr = (await publicClient.readContract({
              address: CONTRACTS.Factory,
              abi: FACTORY_ABI,
              functionName: "allPairs",
              args: [BigInt(i)],
            })) as `0x${string}`;

            const [reserves, t0Addr, t1Addr, totalSupply] = await Promise.all([
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "getReserves" }),
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "token0" }),
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "token1" }),
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "totalSupply" }),
            ]);

            const [token0, token1] = await Promise.all([
              fetchTokenMeta(publicClient, t0Addr as `0x${string}`),
              fetchTokenMeta(publicClient, t1Addr as `0x${string}`),
            ]);

            const [r0, r1] = reserves as [bigint, bigint, number];

            let userLp = 0n;
            if (address) {
              try {
                userLp = (await publicClient.readContract({
                  address: pairAddr,
                  abi: PAIR_ABI,
                  functionName: "balanceOf",
                  args: [address],
                })) as bigint;
              } catch {}
            }

            poolList.push({
              address: pairAddr,
              token0,
              token1,
              reserve0: r0,
              reserve1: r1,
              totalSupply: totalSupply as bigint,
              userLpBalance: userLp,
            });
          } catch {
            continue;
          }
        }

        setPools(poolList);
      } catch (err) {
        console.error("[PlotSwap] Pool fetch error:", err);
      }
      setIsLoading(false);
    };

    fetchPools();
    const interval = setInterval(fetchPools, 30000);
    return () => clearInterval(interval);
  }, [publicClient, address]);

  const filtered = pools.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.token0.symbol.toLowerCase().includes(q) ||
      p.token1.symbol.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-[560px] mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-plotswap-text">Existing Pools</h2>
        <span className="text-xs text-plotswap-text-muted">{pools.length} pool{pools.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by token symbol or pool address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field w-full px-4 py-2.5 text-sm mb-4"
      />

      {isLoading ? (
        <div className="glass-card p-8 text-center">
          <div className="w-6 h-6 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-plotswap-text-muted">Loading pools from chain...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-plotswap-text-muted mb-1">
            {pools.length === 0 ? "No pools created yet" : "No pools match your search"}
          </p>
          <p className="text-xs text-plotswap-text-subtle">
            {pools.length === 0 ? "Be the first to add liquidity!" : "Try a different search term"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pool) => {
            const sharePercent = pool.totalSupply > 0n && pool.userLpBalance > 0n
              ? Number((pool.userLpBalance * 10000n) / pool.totalSupply) / 100
              : 0;

            return (
              <div key={pool.address} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  {/* Pair info */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-[10px] font-bold text-plotswap-primary border-2 border-plotswap-bg">
                        {pool.token0.symbol.slice(0, 2)}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-plotswap-accent/20 flex items-center justify-center text-[10px] font-bold text-plotswap-accent border-2 border-plotswap-bg">
                        {pool.token1.symbol.slice(0, 2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-plotswap-text">
                        {pool.token0.symbol} / {pool.token1.symbol}
                      </div>
                      <a
                        href={`https://explorer.integralayer.com/address/${pool.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-plotswap-primary font-mono hover:text-plotswap-primary-hover"
                      >
                        {pool.address.slice(0, 8)}...{pool.address.slice(-6)}
                      </a>
                    </div>
                  </div>

                  {/* Reserves */}
                  <div className="text-right text-xs text-plotswap-text-muted">
                    <div>{formatTokenAmount(pool.reserve0, pool.token0.decimals, 2)} {pool.token0.symbol}</div>
                    <div>{formatTokenAmount(pool.reserve1, pool.token1.decimals, 2)} {pool.token1.symbol}</div>
                  </div>
                </div>

                {/* User position */}
                {pool.userLpBalance > 0n && (
                  <div className="mt-3 pt-3 border-t border-plotswap-border flex items-center justify-between">
                    <div className="text-xs text-plotswap-text-muted">
                      Your LP: <span className="font-mono text-plotswap-text">{formatTokenAmount(pool.userLpBalance, 18, 6)}</span>
                      <span className="ml-2">({sharePercent.toFixed(2)}%)</span>
                    </div>
                    <button
                      onClick={onManage}
                      className="text-xs font-medium text-plotswap-primary hover:text-plotswap-primary-hover transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
