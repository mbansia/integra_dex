"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

// ERC-20 / ERC-721 share the same balanceOf(address) signature
const BALANCE_OF_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC-1155 uses balanceOf(address, uint256)
const ERC1155_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC-165 interface check
const SUPPORTS_INTERFACE_ABI = [
  {
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Interface IDs
const ERC1155_INTERFACE = "0xd9b67a26";

export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address, publicClient } = useWeb3();
  const [balance, setBalance] = useState<bigint>(0n);

  useEffect(() => {
    if (!address || !tokenAddress || tokenAddress === "0x") {
      setBalance(0n);
      return;
    }

    const fetchBalance = async () => {
      try {
        if (tokenAddress === NATIVE_TOKEN) {
          const bal = await publicClient.getBalance({ address });
          setBalance(bal);
          return;
        }

        // Try standard balanceOf(address) — works for ERC-20 and ERC-721
        try {
          const bal = await publicClient.readContract({
            address: tokenAddress,
            abi: BALANCE_OF_ABI,
            functionName: "balanceOf",
            args: [address],
          });
          setBalance(bal as bigint);
          return;
        } catch {}

        // Check if it's ERC-1155
        try {
          const is1155 = await publicClient.readContract({
            address: tokenAddress,
            abi: SUPPORTS_INTERFACE_ABI,
            functionName: "supportsInterface",
            args: [ERC1155_INTERFACE],
          });
          if (is1155) {
            // Try common token IDs (0, 1, 2) and sum balances
            let total = 0n;
            for (let id = 0; id < 5; id++) {
              try {
                const bal = await publicClient.readContract({
                  address: tokenAddress,
                  abi: ERC1155_BALANCE_ABI,
                  functionName: "balanceOf",
                  args: [address, BigInt(id)],
                });
                total += bal as bigint;
              } catch {}
            }
            setBalance(total);
            return;
          }
        } catch {}

        setBalance(0n);
      } catch {
        setBalance(0n);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address, tokenAddress, publicClient]);

  return balance;
}
