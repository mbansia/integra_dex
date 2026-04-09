export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  isERC1404: boolean;
}

// Known tokens on Integra Testnet (chain ID 26218)
// Auto-discovery from Factory pairs supplements this list
export const DEFAULT_TOKEN_LIST: TokenInfo[] = [
  {
    address: "0xa640D8B5C9Cb3b989881B8E63B0f30179C78a04f",
    name: "Testnet USDI",
    symbol: "tUSDI",
    decimals: 18,
    logoURI: "",
    isERC1404: false,
  },
];
