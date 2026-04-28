import { NEW_CONTRACTS } from "./deployments";

// Deployed contract addresses on Integra Testnet (chain ID 26218)
export const CONTRACTS = {
  Factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x5a9E1b7634F36f5E8752160c018e1cF1e8ED5C1d") as `0x${string}`,
  Router: (process.env.NEXT_PUBLIC_ROUTER_ADDRESS || "0xF9F70bED36663D79f54152e8848ad34a454a0199") as `0x${string}`,
  WIRL: (process.env.NEXT_PUBLIC_WIRL_ADDRESS || "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34") as `0x${string}`,
  AgentAuth: NEW_CONTRACTS.AgentAuth,
  IRWAWrapper: NEW_CONTRACTS.IRWAWrapper,
  GlobalOrderBook: NEW_CONTRACTS.GlobalOrderBook,
  BondingCurveLauncher: NEW_CONTRACTS.BondingCurveLauncher,
  YieldSplitter: NEW_CONTRACTS.YieldSplitter,
} as const;
