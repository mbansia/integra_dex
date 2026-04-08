"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";

const ERC1404_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "detectTransferRestriction",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "restrictionCode", type: "uint8" }],
    name: "messageForTransferRestriction",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface RestrictionResult {
  restricted: boolean;
  message: string | null;
  isChecking: boolean;
}

/**
 * Pre-checks ERC-1404 transfer restrictions before sending a transaction.
 * For non-1404 tokens, always returns { restricted: false }.
 */
export function useTransferRestriction(
  tokenAddress: `0x${string}` | undefined,
  from: `0x${string}` | undefined,
  to: `0x${string}` | undefined,
  amount: bigint,
  isERC1404: boolean
): RestrictionResult {
  const { publicClient } = useWeb3();
  const [result, setResult] = useState<RestrictionResult>({
    restricted: false,
    message: null,
    isChecking: false,
  });

  useEffect(() => {
    if (
      !isERC1404 ||
      !tokenAddress ||
      tokenAddress === "0x" ||
      !from ||
      !to ||
      amount === 0n
    ) {
      setResult({ restricted: false, message: null, isChecking: false });
      return;
    }

    const check = async () => {
      setResult((prev) => ({ ...prev, isChecking: true }));
      try {
        const code = (await publicClient.readContract({
          address: tokenAddress,
          abi: ERC1404_ABI,
          functionName: "detectTransferRestriction",
          args: [from, to, amount],
        })) as number;

        if (code !== 0) {
          const message = (await publicClient.readContract({
            address: tokenAddress,
            abi: ERC1404_ABI,
            functionName: "messageForTransferRestriction",
            args: [code],
          })) as string;

          setResult({ restricted: true, message, isChecking: false });
        } else {
          setResult({ restricted: false, message: null, isChecking: false });
        }
      } catch {
        // If the call fails, token may not be ERC-1404 or another issue — don't block
        setResult({ restricted: false, message: null, isChecking: false });
      }
    };

    const debounce = setTimeout(check, 500);
    return () => clearTimeout(debounce);
  }, [tokenAddress, from, to, amount, isERC1404, publicClient]);

  return result;
}
