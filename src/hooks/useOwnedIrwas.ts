"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import {
  getOwnedPassports,
  passportImage,
  type Passport,
} from "@/lib/passport-api";
import type { TokenInfo } from "@/lib/token-list";

// iRWA tokens minted via IRWAWrapper are uniformly 18-decimal ERC-1404s
// today. If that ever changes we'll want to enrich each row with on-chain
// decimals(), but for the current registry these defaults are correct.
const IRWA_DECIMALS = 18;
const IRWA_IS_ERC1404 = true;

function passportToTokenInfo(p: Passport): TokenInfo {
  return {
    address: p.tokenAddress.toLowerCase() as `0x${string}`,
    name: p.name || p.symbol || "iRWA",
    symbol: p.symbol || "?",
    decimals: IRWA_DECIMALS,
    logoURI: passportImage(p) ?? "",
    isERC1404: IRWA_IS_ERC1404,
  };
}

interface State {
  tokens: TokenInfo[];
  passports: Passport[];
  isLoading: boolean;
  error: string | null;
}

const EMPTY: State = { tokens: [], passports: [], isLoading: false, error: null };
const cache = new Map<string, State>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();

function setState(addr: string, next: State) {
  cache.set(addr, next);
  listeners.get(addr)?.forEach((l) => l());
}

async function fetchOwned(addr: `0x${string}`): Promise<void> {
  const key = addr.toLowerCase();
  setState(key, { ...(cache.get(key) ?? EMPTY), isLoading: true, error: null });
  try {
    const passports = await getOwnedPassports(addr);
    setState(key, {
      tokens: passports.map(passportToTokenInfo),
      passports,
      isLoading: false,
      error: null,
    });
  } catch (err: unknown) {
    setState(key, {
      tokens: cache.get(key)?.tokens ?? [],
      passports: cache.get(key)?.passports ?? [],
      isLoading: false,
      error: err instanceof Error ? err.message : "Failed to load owned iRWAs",
    });
  }
}

/**
 * Tokens this wallet **created** as iRWA passports. Per the API contract,
 * tokens bought via GOB or received via transfer are NOT included — that's
 * what useWalletTokens (Transfer-event scan) covers separately.
 *
 * Indexer cycles every 5 min so freshly minted tokens may take that long
 * to appear.
 */
export function useOwnedIrwas(): State {
  const { address } = useWeb3();
  const [, force] = useState(0);

  useEffect(() => {
    if (!address) return;
    const key = address.toLowerCase();
    if (!listeners.has(key)) listeners.set(key, new Set());
    const update = () => force((n) => n + 1);
    listeners.get(key)!.add(update);
    if (!cache.has(key) && !inflight.has(key)) {
      const p = fetchOwned(address).finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return () => {
      listeners.get(key)?.delete(update);
    };
  }, [address]);

  if (!address) return EMPTY;
  return cache.get(address.toLowerCase()) ?? { ...EMPTY, isLoading: true };
}
