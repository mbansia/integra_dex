"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { FACTORY_ABI } from "@/lib/abis/PlotswapFactory";
import { PAIR_ABI } from "@/lib/abis/PlotswapPair";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { formatTokenAmount } from "@/lib/utils";
import { RemoveLiquidityForm } from "./remove-liquidity-form";
import { TokenLogo } from "@/components/shared/token-logo";
import type { PairData } from "@/hooks/usePair";
import type { TokenInfo } from "@/lib/token-list";

interface Position {
  pair: PairData;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
}

async function fetchTokenMeta(publicClient: any, addr: `0x${string}`): Promise<TokenInfo> {
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
    return { address: addr, name, symbol: symbol as string, decimals: Number(decimals), logoURI: "", isERC1404: false };
  } catch {
    return { address: addr, name: addr.slice(0, 8), symbol: addr.slice(0, 6), decimals: 18, logoURI: "", isERC1404: false };
  }
}

export function UserPositions() {
  const { publicClient, address, isConnected } = useWeb3();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !CONTRACTS.Factory || CONTRACTS.Factory === "0x") {
      setPositions([]);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const count = (await publicClient.readContract({
          address: CONTRACTS.Factory,
          abi: FACTORY_ABI,
          functionName: "allPairsLength",
        })) as bigint;

        const found: Position[] = [];

        for (let i = 0; i < Number(count) && i < 50; i++) {
          try {
            const pairAddr = (await publicClient.readContract({
              address: CONTRACTS.Factory,
              abi: FACTORY_ABI,
              functionName: "allPairs",
              args: [BigInt(i)],
            })) as `0x${string}`;

            const userLp = (await publicClient.readContract({
              address: pairAddr,
              abi: PAIR_ABI,
              functionName: "balanceOf",
              args: [address],
            })) as bigint;

            if (userLp === 0n) continue;

            const [reserves, t0, t1, totalSupply] = await Promise.all([
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "getReserves" }),
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "token0" }),
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "token1" }),
              publicClient.readContract({ address: pairAddr, abi: PAIR_ABI, functionName: "totalSupply" }),
            ]);

            const [r0, r1] = reserves as [bigint, bigint, number];
            const [tokenA, tokenB] = await Promise.all([
              fetchTokenMeta(publicClient, t0 as `0x${string}`),
              fetchTokenMeta(publicClient, t1 as `0x${string}`),
            ]);

            found.push({
              pair: {
                address: pairAddr,
                reserve0: r0,
                reserve1: r1,
                token0: t0 as `0x${string}`,
                token1: t1 as `0x${string}`,
                totalSupply: totalSupply as bigint,
                userLpBalance: userLp,
              },
              tokenA,
              tokenB,
            });
          } catch { continue; }
        }

        setPositions(found);
      } catch (err) {
        console.error("[PlotSwap] Position fetch error:", err);
      }
      setIsLoading(false);
    };

    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [publicClient, address, isConnected]);

  if (!isConnected) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-plotswap-text-muted text-sm mb-1">Connect your wallet to view positions</p>
        <p className="text-xs text-plotswap-text-subtle">Your active liquidity positions will appear here</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-6 h-6 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-plotswap-text-muted">Loading your positions...</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-plotswap-text-muted text-sm mb-1">No liquidity positions found</p>
        <p className="text-xs text-plotswap-text-subtle">Add liquidity to a pool to see your positions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {positions.map((pos) => {
        const share = pos.pair.totalSupply > 0n
          ? Number((pos.pair.userLpBalance * 10000n) / pos.pair.totalSupply) / 100
          : 0;
        const yourToken0 = pos.pair.totalSupply > 0n
          ? (pos.pair.userLpBalance * pos.pair.reserve0) / pos.pair.totalSupply
          : 0n;
        const yourToken1 = pos.pair.totalSupply > 0n
          ? (pos.pair.userLpBalance * pos.pair.reserve1) / pos.pair.totalSupply
          : 0n;

        return (
          <div key={pos.pair.address} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <TokenLogo
                    address={pos.tokenA.address}
                    symbol={pos.tokenA.symbol}
                    logoURI={pos.tokenA.logoURI}
                    className="w-8 h-8 border-2 border-plotswap-bg"
                    fallbackTextClassName="text-[10px]"
                  />
                  <TokenLogo
                    address={pos.tokenB.address}
                    symbol={pos.tokenB.symbol}
                    logoURI={pos.tokenB.logoURI}
                    className="w-8 h-8 border-2 border-plotswap-bg"
                    fallbackClassName="bg-plotswap-accent/20 text-plotswap-accent"
                    fallbackTextClassName="text-[10px]"
                  />
                </div>
                <div>
                  <div className="font-semibold text-sm text-plotswap-text">
                    {pos.tokenA.symbol} / {pos.tokenB.symbol}
                  </div>
                  <div className="text-[11px] text-plotswap-text-muted">
                    Pool share: {share.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-plotswap-text font-mono">{formatTokenAmount(pos.pair.userLpBalance, 18, 6)} LP</div>
              </div>
            </div>

            {/* Your tokens in pool */}
            <div className="mt-3 pt-3 border-t border-plotswap-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-plotswap-text-muted">Your {pos.tokenA.symbol}</span>
                <div className="font-mono text-plotswap-text">{formatTokenAmount(yourToken0, pos.tokenA.decimals, 4)}</div>
              </div>
              <div className="text-right">
                <span className="text-plotswap-text-muted">Your {pos.tokenB.symbol}</span>
                <div className="font-mono text-plotswap-text">{formatTokenAmount(yourToken1, pos.tokenB.decimals, 4)}</div>
              </div>
            </div>

            {/* Remove button */}
            <div className="mt-3">
              <button
                onClick={() => setRemoving(removing === pos.pair.address ? null : pos.pair.address)}
                className="text-xs font-medium text-plotswap-primary hover:text-plotswap-primary-hover transition-colors"
              >
                {removing === pos.pair.address ? "Cancel" : "Remove Liquidity"}
              </button>
            </div>

            {removing === pos.pair.address && (
              <RemoveLiquidityForm
                pair={pos.pair}
                tokenA={pos.tokenA}
                tokenB={pos.tokenB}
                onClose={() => setRemoving(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
