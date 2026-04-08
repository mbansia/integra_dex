export const FACTORY_ABI = [
  {
    inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }],
    name: "getPair",
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "allPairs",
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "allPairsLength",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }],
    name: "createPair",
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
