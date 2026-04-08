export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  isERC1404: boolean;
}

export const DEFAULT_TOKEN_LIST: TokenInfo[] = [
  {
    address: (process.env.NEXT_PUBLIC_WIRL_ADDRESS ?? "0x") as `0x${string}`,
    name: "Wrapped IRL",
    symbol: "WIRL",
    decimals: 18,
    logoURI: "/tokens/wirl.svg",
    isERC1404: false,
  },
  {
    address: "0x0000000000000000000000000000000000000001",
    name: "Mock USDC",
    symbol: "mUSDC",
    decimals: 6,
    logoURI: "/tokens/usdc.svg",
    isERC1404: false,
  },
  {
    address: "0x0000000000000000000000000000000000000002",
    name: "Mock Security Token",
    symbol: "mSEC",
    decimals: 18,
    logoURI: "/tokens/sec.svg",
    isERC1404: true,
  },
];
