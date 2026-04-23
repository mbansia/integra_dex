import deploymentJson from "../../integra-testnet-with-abis.json";

type Address = `0x${string}`;

interface Deployment {
  network: string;
  chainId: number;
  rpc: string;
  explorer: string;
  deployedAt: string;
  contracts: Record<string, { address: string; abi: unknown[] }>;
}

const deployment = deploymentJson as Deployment;

function addr(key: string, envOverride?: string): Address {
  const fromEnv = envOverride && envOverride.startsWith("0x") ? envOverride : undefined;
  const fromFile = deployment.contracts[key]?.address;
  const picked = fromEnv || fromFile;
  if (!picked || !picked.startsWith("0x")) {
    throw new Error(`[deployments] no address for ${key}`);
  }
  return picked as Address;
}

export const DEPLOYMENT_META = {
  network: deployment.network,
  chainId: deployment.chainId,
  rpc: deployment.rpc,
  explorer: deployment.explorer,
  deployedAt: deployment.deployedAt,
};

export const NEW_CONTRACTS = {
  AgentAuth: addr("AgentAuth", process.env.NEXT_PUBLIC_AGENT_AUTH_ADDRESS),
  IRWAWrapper: addr("IRWAWrapper", process.env.NEXT_PUBLIC_IRWA_WRAPPER_ADDRESS),
  GlobalOrderBook: addr("GlobalOrderBook", process.env.NEXT_PUBLIC_GLOBAL_ORDERBOOK_ADDRESS),
  BondingCurveLauncher: addr("BondingCurveLauncher", process.env.NEXT_PUBLIC_BONDING_CURVE_ADDRESS),
  YieldSplitter: addr("YieldSplitter", process.env.NEXT_PUBLIC_YIELD_SPLITTER_ADDRESS),
} as const;
