// Maps known error signatures to human-readable messages
const ERROR_MAP: Record<string, string> = {
  // Router errors
  "0xf16d0f71": "Transaction deadline has passed. Try again.",
  "0xfa287ed9": "Token A amount is below the minimum. The pool ratio requires different amounts — try adjusting your input.",
  "0xe51dd6d8": "Token B amount is below the minimum. The pool ratio requires different amounts — try adjusting your input.",
  "0x1fb9b01b": "You would receive less than your minimum. Try increasing your slippage tolerance.",
  "0xcba2fdae": "You would need to spend more than your maximum. Try increasing your slippage tolerance.",
  "0x06ae7cb6": "This token has transfer restrictions (ERC-1404). Your address may not be whitelisted — contact the token issuer for access.",

  // Library errors
  "0x74dd7e27": "Cannot create a pool with two identical tokens.",
  "0xe4491402": "Invalid token address (zero address).",
  "0x2acaa9e3": "Amount must be greater than zero.",
  "0xe1f93826": "Not enough liquidity in the pool for this trade.",
  "0x3af746b3": "Invalid swap path. Make sure both tokens are selected.",

  // Factory errors
  "0xe3015e4d": "Cannot create a pool with two identical tokens.",
  "0xa84718a9": "Invalid token address.",
  "0xd186cb01": "This pool already exists.",
  "0x3547c0fb": "Only the fee setter can perform this action.",

  // Pair errors
  "0x9330b3d6": "Not enough liquidity minted. Try adding more of both tokens.",
  "0x29b5aceb": "Amount too large — exceeds maximum supported value.",
  "0x1365f5e6": "Pool is temporarily locked. Try again in a moment.",
  "0xba0e9d02": "Only the factory can perform this action.",

  // OpenZeppelin ERC-20 errors
  "0xfb8f41b2": "Token allowance too low. You need to approve the token before this transaction.",
  "0xe450d38c": "Insufficient token balance. You don't have enough of this token.",
  "0x94280d62": "Invalid token approval.",
  "0x96c6fd1e": "Invalid spender address.",
  "0x8b6e1e2e": "Invalid sender address.",
};

export function decodeError(errorMessage: string): string {
  // Check for known signature in the error message
  for (const [sig, message] of Object.entries(ERROR_MAP)) {
    if (errorMessage.includes(sig)) {
      return message;
    }
  }

  // Common text patterns
  if (errorMessage.includes("user rejected") || errorMessage.includes("User rejected") || errorMessage.includes("ACTION_REJECTED")) {
    return "You rejected the transaction in your wallet.";
  }
  if (errorMessage.includes("insufficient funds")) {
    return "Not enough IRL for gas fees. Get more from the faucet.";
  }
  if (errorMessage.includes("nonce")) {
    return "Transaction nonce error. Try resetting your wallet's pending transactions.";
  }
  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return "Transaction timed out. It may still be processing — check your wallet.";
  }
  if (errorMessage.includes("network") || errorMessage.includes("disconnected")) {
    return "Network connection issue. Check your internet and try again.";
  }

  // Fallback: try to extract a readable part
  const match = errorMessage.match(/reason:\s*"([^"]+)"/);
  if (match) return match[1];

  // If it's a short message, return it. If it's long/technical, give a generic one.
  if (errorMessage.length < 100 && !errorMessage.includes("0x")) {
    return errorMessage;
  }

  return "Something went wrong. Please try again or adjust your amounts.";
}
