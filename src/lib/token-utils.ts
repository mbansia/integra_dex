import { formatUnits, parseUnits } from "viem";

/**
 * Detect if a token uses "raw wei" amounts — i.e. declared decimals
 * are 18 but the actual circulating amounts are tiny wei values
 * (like iRWA tokens minted with raw integer amounts).
 *
 * Heuristic: if the balance as a formatted number < 0.001 but
 * the raw balance > 0, the token is likely using raw wei units.
 */
export function isRawWeiToken(balance: bigint, decimals: number): boolean {
  if (balance === 0n || decimals === 0) return false;
  // If the formatted balance is less than 0.001 but raw > 0
  const threshold = 10n ** BigInt(Math.max(0, decimals - 3));
  return balance > 0n && balance < threshold;
}

/**
 * Get effective decimals for a token based on its balance.
 * Raw wei tokens get 0 effective decimals.
 */
export function getEffectiveDecimals(balance: bigint, declaredDecimals: number): number {
  return isRawWeiToken(balance, declaredDecimals) ? 0 : declaredDecimals;
}

/**
 * Format token amount, handling raw wei tokens.
 */
export function smartFormatAmount(amount: bigint, decimals: number, maxDecimals = 6): string {
  if (amount === 0n) return "0";

  if (isRawWeiToken(amount, decimals)) {
    // Show raw integer
    return amount.toString();
  }

  const formatted = formatUnits(amount, decimals);
  const parts = formatted.split(".");
  if (parts.length === 1) return formatted;
  const trimmed = parts[1].slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${parts[0]}.${trimmed}` : parts[0];
}

/**
 * Parse user input to bigint, handling raw wei tokens.
 */
export function smartParseAmount(input: string, decimals: number, balance: bigint): bigint {
  if (!input || input === "0") return 0n;
  try {
    if (isRawWeiToken(balance, decimals)) {
      // Parse as raw integer (no decimal scaling)
      return BigInt(Math.floor(parseFloat(input)));
    }
    return parseUnits(input, decimals);
  } catch {
    return 0n;
  }
}
