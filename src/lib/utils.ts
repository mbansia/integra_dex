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
  if (amount === 0n) return "0";

  const formatted = formatUnits(amount, decimals);
  const parts = formatted.split(".");

  // If the formatted result rounds to 0 but amount > 0, show raw units
  if (parts[0] === "0" && amount > 0n) {
    const trimmed = parts[1]?.replace(/0+$/, "") || "";
    if (trimmed === "" || trimmed.length > maxDecimals) {
      // Amount is too small for decimal display — show as raw integer
      return amount.toString();
    }
  }

  if (parts.length === 1) return formatted;
  const decimalsStr = parts[1].slice(0, maxDecimals).replace(/0+$/, "");
  return decimalsStr ? `${parts[0]}.${decimalsStr}` : parts[0];
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
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.explorer.integralayer.com";
  return `${base}/${type}/${hashOrAddress}`;
}

export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n) return 0;

  // Spot price: what 1 unit of tokenIn would get you at the current reserve ratio
  // Execution price: what you actually got
  // Impact = (spotPrice - executionPrice) / spotPrice * 100

  // Use floating point with decimals normalized out (both are raw amounts,
  // decimal differences cancel in the ratio)
  const rIn = Number(reserveIn);
  const rOut = Number(reserveOut);
  const aIn = Number(amountIn);
  const aOut = Number(amountOut);

  if (rIn === 0 || aIn === 0) return 0;

  const spotPrice = rOut / rIn;
  const executionPrice = aOut / aIn;
  const impact = ((spotPrice - executionPrice) / spotPrice) * 100;
  return Math.max(0, Math.min(100, impact));
}

export function calculateMinimumReceived(
  amountOut: bigint,
  slippageBps: number
): bigint {
  return amountOut - (amountOut * BigInt(slippageBps)) / 10000n;
}
