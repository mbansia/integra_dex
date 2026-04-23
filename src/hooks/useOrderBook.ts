"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { GLOBAL_ORDER_BOOK_ABI } from "@/lib/abis/GlobalOrderBook";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { CONTRACTS } from "@/lib/contracts";
import { maxUint256 } from "viem";

export type OrderRow = {
  orderId: bigint;
  maker: `0x${string}`;
  sellToken: `0x${string}`;
  sellAmount: bigint;
  sellTokenId: bigint;
  priceInIRL: bigint;
  priceInTUSDI: bigint;
  expiresAt: bigint;
  active: boolean;
  raw: any;
};

function toOrderRow(o: any): OrderRow {
  return {
    orderId: o.orderId ?? o[0],
    maker: (o.maker ?? o[1]) as `0x${string}`,
    sellToken: (o.sellToken ?? o[2]) as `0x${string}`,
    sellAmount: o.sellAmount ?? o[3],
    sellTokenId: o.sellTokenId ?? o[4] ?? 0n,
    priceInIRL: o.priceInIRL ?? o[5] ?? 0n,
    priceInTUSDI: o.priceInTUSDI ?? o[6] ?? 0n,
    expiresAt: o.expiresAt ?? o[7] ?? 0n,
    active: Boolean(o.active ?? o[8] ?? true),
    raw: o,
  };
}

export function useOrderBook(sellToken?: `0x${string}`, offset = 0n, limit = 50n) {
  const { publicClient } = useWeb3();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = sellToken
        ? ((await publicClient.readContract({
            address: CONTRACTS.GlobalOrderBook,
            abi: GLOBAL_ORDER_BOOK_ABI,
            functionName: "getOrderBook",
            args: [sellToken, offset, limit],
          })) as any[])
        : ((await publicClient.readContract({
            address: CONTRACTS.GlobalOrderBook,
            abi: GLOBAL_ORDER_BOOK_ABI,
            functionName: "getAllOrders",
            args: [offset, limit],
          })) as any[]);
      setOrders(result.map(toOrderRow));
    } catch (err) {
      console.error("[OrderBook] fetch failed:", err);
    }
    setIsLoading(false);
  }, [publicClient, sellToken, offset, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { orders, isLoading, refresh };
}

export function useOrderBookActions() {
  const { address, walletClient, publicClient } = useWeb3();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function ensureAllowance(token: `0x${string}`, amount: bigint) {
    const allowance = (await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address!, CONTRACTS.GlobalOrderBook],
    })) as bigint;
    if (allowance < amount) {
      const approveHash = await walletClient!.writeContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.GlobalOrderBook, maxUint256],
        account: address!,
        chain: walletClient!.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }
  }

  const listAsset = useCallback(
    async (
      sellToken: `0x${string}`,
      sellAmount: bigint,
      sellTokenId: bigint,
      priceInIRL: bigint,
      priceInTUSDI: bigint,
      expiresAt: bigint
    ) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        await ensureAllowance(sellToken, sellAmount);
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "listAsset",
          args: [sellToken, sellAmount, sellTokenId, priceInIRL, priceInTUSDI, expiresAt],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Asset listed");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "List failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const cancelListing = useCallback(
    async (orderId: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "cancelListing",
          args: [orderId],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Listing cancelled");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Cancel failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const placeBid = useCallback(
    async (orderId: bigint, currency: 0 | 1, bidPrice: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "placeBid",
          args: [orderId, currency, bidPrice],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Bid placed");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Bid failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const placeMarketOrder = useCallback(
    async (orderId: bigint, currency: 0 | 1, value: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "placeMarketOrder",
          args: [orderId, currency],
          value: currency === 0 ? value : 0n,
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Order filled");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Market order failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const acceptOffer = useCallback(
    async (negotiationId: bigint, value: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "acceptOffer",
          args: [negotiationId],
          value,
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Offer accepted");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Accept failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const counterOffer = useCallback(
    async (negotiationId: bigint, newPrice: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "counterOffer",
          args: [negotiationId, newPrice],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Counter offer sent");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Counter failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  const rejectOffer = useCallback(
    async (negotiationId: bigint) => {
      if (!walletClient || !address) return false;
      setIsPending(true);
      setError(null);
      setSuccess(null);
      try {
        const hash = await walletClient.writeContract({
          address: CONTRACTS.GlobalOrderBook,
          abi: GLOBAL_ORDER_BOOK_ABI,
          functionName: "rejectOffer",
          args: [negotiationId],
          account: address,
          chain: walletClient.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setSuccess("Offer rejected");
        return true;
      } catch (err: any) {
        setError(err?.shortMessage || err?.message || "Reject failed");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [walletClient, address, publicClient]
  );

  return {
    listAsset,
    cancelListing,
    placeBid,
    placeMarketOrder,
    acceptOffer,
    counterOffer,
    rejectOffer,
    isPending,
    error,
    success,
  };
}
