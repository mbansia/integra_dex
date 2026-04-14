import { defineChain } from "viem";

export const integraTestnet = defineChain({
  id: 26218,
  name: "Integra Testnet",
  nativeCurrency: { name: "IRL", symbol: "IRL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.integralayer.com/evm"] },
  },
  blockExplorers: {
    default: {
      name: "Integra Explorer",
      url: "https://blockscout.integralayer.com",
    },
  },
  testnet: true,
});
