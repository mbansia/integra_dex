export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  isERC1404: boolean;
}

// Tokens are auto-discovered from on-chain Factory pairs.
// This list is only used as a fallback when Factory is not deployed yet.
export const DEFAULT_TOKEN_LIST: TokenInfo[] = [];
