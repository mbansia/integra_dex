"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";

const PASSPORT_ABI = [
  { inputs: [], name: "passportURI", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
] as const;

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function resolveIpfs(url: string): string {
  if (url.startsWith("ipfs://")) return IPFS_GATEWAY + url.slice("ipfs://".length);
  return url;
}

type CacheEntry = { logoUrl: string | null; ts: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

async function fetchLogo(
  address: string,
  publicClient: ReturnType<typeof useWeb3>["publicClient"],
): Promise<string | null> {
  let uri: string;
  try {
    uri = (await publicClient.readContract({
      address: address as `0x${string}`,
      abi: PASSPORT_ABI,
      functionName: "passportURI",
    })) as string;
  } catch {
    return null;
  }
  if (!uri) return null;

  const resolved = resolveIpfs(uri.trim());
  try {
    const res = await fetch(resolved);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.startsWith("image/")) return resolved;
    const meta: any = await res.json();
    const firstImageEntry = Array.isArray(meta?.images)
      ? meta.images.find((x: unknown) => typeof x === "string" && x)
      : null;
    const raw =
      meta?.image ||
      meta?.imageURI ||
      meta?.image_url ||
      meta?.logo ||
      meta?.logoURI ||
      firstImageEntry ||
      null;
    if (typeof raw !== "string" || !raw) return null;
    return resolveIpfs(raw.trim());
  } catch {
    return null;
  }
}

export function useTokenLogo(address: string | undefined, fallbackLogoURI?: string): string | null {
  const { publicClient } = useWeb3();
  const [logo, setLogo] = useState<string | null>(() => {
    if (fallbackLogoURI) return resolveIpfs(fallbackLogoURI);
    if (!address) return null;
    const hit = cache.get(address.toLowerCase());
    return hit?.logoUrl ?? null;
  });

  useEffect(() => {
    if (fallbackLogoURI) {
      setLogo(resolveIpfs(fallbackLogoURI));
      return;
    }
    if (!address) return;
    const key = address.toLowerCase();
    const hit = cache.get(key);
    if (hit) {
      setLogo(hit.logoUrl);
      return;
    }

    let cancelled = false;
    let promise = inflight.get(key);
    if (!promise) {
      promise = fetchLogo(address, publicClient).then((url) => {
        cache.set(key, { logoUrl: url, ts: Date.now() });
        inflight.delete(key);
        return url;
      });
      inflight.set(key, promise);
    }
    promise.then((url) => { if (!cancelled) setLogo(url); });
    return () => { cancelled = true; };
  }, [address, fallbackLogoURI, publicClient]);

  return logo;
}
