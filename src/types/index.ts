export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  isERC1404: boolean;
}

export interface PairInfo {
  address: `0x${string}`;
  token0: TokenInfo;
  token1: TokenInfo;
  reserve0: bigint;
  reserve1: bigint;
}

export interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  path: `0x${string}`[];
  minimumReceived: bigint;
}
