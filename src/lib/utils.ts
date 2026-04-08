import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxDecimals = 6
): string {
  const formatted = formatUnits(amount, decimals);
  const parts = formatted.split(".");
  if (parts.length === 1) return formatted;
  return `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

export function getExplorerUrl(
  hashOrAddress: string,
  type: "tx" | "address" = "tx"
): string {
  const base =
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.integralayer.com";
  return `${base}/${type}/${hashOrAddress}`;
}

export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  const spotPrice = Number(reserveOut) / Number(reserveIn);
  const executionPrice = Number(amountOut) / Number(amountIn);
  const impact = ((spotPrice - executionPrice) / spotPrice) * 100;
  return Math.max(0, impact);
}

export function calculateMinimumReceived(
  amountOut: bigint,
  slippageBps: number
): bigint {
  return amountOut - (amountOut * BigInt(slippageBps)) / 10000n;
}
