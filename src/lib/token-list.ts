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
    address: "0x0000000000000000000000000000000000000000",
    name: "IRL",
    symbol: "IRL",
    decimals: 18,
    logoURI: "",
    isERC1404: false,
  },
  {
    address: "0x8251b03802b98f2Ea58457e28C57B0Fbd3101eF5",
    name: "Wrapped IRL",
    symbol: "WIRL",
    decimals: 18,
    logoURI: "",
    isERC1404: false,
  },
  {
    address: "0xa640D8B5C9Cb3b989881B8E63B0f30179C78a04f",
    name: "Testnet USDI",
    symbol: "tUSDI",
    decimals: 18,
    logoURI: "",
    isERC1404: false,
  },
  {
    address: "0x7DBa43a90AB60168a72cEeb1CFEe9fe4bC902754",
    name: "Mock USDC",
    symbol: "mUSDC",
    decimals: 6,
    logoURI: "",
    isERC1404: false,
  },
  {
    address: "0xcdC3e75A5953Ee83C6360eb4C5c8fB5Bf0572D9c",
    name: "Mock Security Token",
    symbol: "mSEC",
    decimals: 18,
    logoURI: "",
    isERC1404: true,
  },
];
