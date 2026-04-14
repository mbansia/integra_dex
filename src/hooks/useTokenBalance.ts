"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

const BALANCE_OF_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const ERC1155_BALANCE_ABI = [
  { inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const SUPPORTS_INTERFACE_ABI = [
  { inputs: [{ name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
] as const;

const IRWA_ABI = [
  { inputs: [], name: "getWrappedPassports", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }, { name: "passportId", type: "uint256" }], name: "balanceOfPool", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const ERC1155_ID = "0xd9b67a26" as `0x${string}`;

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
        // Native IRL
        if (tokenAddress === NATIVE_TOKEN) {
          setBalance(await publicClient.getBalance({ address }));
          return;
        }

        // Check if ERC-1155 first (since balanceOf(address) doesn't work for 1155)
        let is1155 = false;
        try {
          is1155 = (await publicClient.readContract({
            address: tokenAddress, abi: SUPPORTS_INTERFACE_ABI,
            functionName: "supportsInterface", args: [ERC1155_ID],
          })) as boolean;
        } catch {}

        if (is1155) {
          // ERC-1155: sum balances for IDs 0-20
          let total = 0n;
          for (let id = 0; id <= 20; id++) {
            try {
              const bal = await publicClient.readContract({
                address: tokenAddress, abi: ERC1155_BALANCE_ABI,
                functionName: "balanceOf", args: [address, BigInt(id)],
              }) as bigint;
              total += bal;
            } catch {}
          }
          setBalance(total);
          return;
        }

        // Try iRWA wrapper: balanceOfPool across all passports
        try {
          const passports = await publicClient.readContract({
            address: tokenAddress, abi: IRWA_ABI, functionName: "getWrappedPassports",
          }) as bigint[];
          if (passports && passports.length > 0) {
            let total = 0n;
            for (const pid of passports) {
              try {
                const poolBal = await publicClient.readContract({
                  address: tokenAddress, abi: IRWA_ABI,
                  functionName: "balanceOfPool", args: [address, pid],
                }) as bigint;
                total += poolBal;
              } catch {}
            }
            setBalance(total);
            return;
          }
        } catch {}

        // Standard balanceOf(address) — ERC-20 and ERC-721
        try {
          const bal = await publicClient.readContract({
            address: tokenAddress, abi: BALANCE_OF_ABI,
            functionName: "balanceOf", args: [address],
          });
          setBalance(bal as bigint);
        } catch {
          setBalance(0n);
        }
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
