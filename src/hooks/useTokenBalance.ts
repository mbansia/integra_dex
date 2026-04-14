"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

// Standard balanceOf(address) — works for ERC-20 and ERC-721
const BALANCE_OF_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

// ERC-1155 balanceOf(address, uint256)
const ERC1155_BALANCE_ABI = [
  { inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

// ERC-165 interface detection
const SUPPORTS_INTERFACE_ABI = [
  { inputs: [{ name: "interfaceId", type: "bytes4" }], name: "supportsInterface", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
] as const;

// iRWA (IRWAToken wrapper) — pool-based balances
const IRWA_ABI = [
  { inputs: [], name: "getWrappedPassports", outputs: [{ type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }, { name: "passportId", type: "uint256" }], name: "balanceOfPool", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const ERC1155_INTERFACE = "0xd9b67a26" as `0x${string}`;

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

        // 1. Try standard balanceOf(address) — ERC-20 and ERC-721
        try {
          const bal = await publicClient.readContract({
            address: tokenAddress, abi: BALANCE_OF_ABI, functionName: "balanceOf", args: [address],
          });
          if ((bal as bigint) > 0n) { setBalance(bal as bigint); return; }
        } catch {}

        // 2. Try iRWA balanceOfPool — sum across all wrapped passports
        try {
          const passports = await publicClient.readContract({
            address: tokenAddress, abi: IRWA_ABI, functionName: "getWrappedPassports",
          }) as bigint[];
          if (passports && passports.length > 0) {
            let total = 0n;
            for (const pid of passports) {
              try {
                const poolBal = await publicClient.readContract({
                  address: tokenAddress, abi: IRWA_ABI, functionName: "balanceOfPool", args: [address, pid],
                }) as bigint;
                total += poolBal;
              } catch {}
            }
            if (total > 0n) { setBalance(total); return; }
          }
        } catch {}

        // 3. Try ERC-1155 — sum common token IDs
        try {
          const is1155 = await publicClient.readContract({
            address: tokenAddress, abi: SUPPORTS_INTERFACE_ABI, functionName: "supportsInterface", args: [ERC1155_INTERFACE],
          });
          if (is1155) {
            let total = 0n;
            for (let id = 0; id < 10; id++) {
              try {
                const bal = await publicClient.readContract({
                  address: tokenAddress, abi: ERC1155_BALANCE_ABI, functionName: "balanceOf", args: [address, BigInt(id)],
                }) as bigint;
                total += bal;
              } catch {}
            }
            setBalance(total);
            return;
          }
        } catch {}

        // 4. Standard balanceOf returned 0 — set it
        try {
          const bal = await publicClient.readContract({
            address: tokenAddress, abi: BALANCE_OF_ABI, functionName: "balanceOf", args: [address],
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
