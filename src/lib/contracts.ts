export const CONTRACTS = {
  Factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x") as `0x${string}`,
  Router: (process.env.NEXT_PUBLIC_ROUTER_ADDRESS ?? "0x") as `0x${string}`,
  WIRL: (process.env.NEXT_PUBLIC_WIRL_ADDRESS ?? "0x") as `0x${string}`,
} as const;
