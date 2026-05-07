// Per-Wallet Tokens API client.
// Replaces IRWAWrapper.getAllTokens() (out-of-gas with 22K+ entries) per the
// Integra integration brief at /per-wallet-tokens-api.pdf.

const RAW_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_WS_URL) ||
  "https://ws.integralayer.com";

// Allow folks to set NEXT_PUBLIC_WS_URL=ws://… by accident — silently coerce.
export const PASSPORT_API_BASE = RAW_BASE.replace("wss://", "https://").replace(
  "ws://",
  "http://"
);

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

export function resolveIpfs(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("ipfs://")) return IPFS_GATEWAY + trimmed.slice("ipfs://".length);
  return trimmed;
}

export interface Passport {
  id: string;
  tokenAddress: `0x${string}`;
  name: string;
  symbol: string;
  images?: string[];
  creator?: `0x${string}`;
  userAddress?: `0x${string}`;
  supply?: string;
  txHash?: `0x${string}`;
  blockNumber?: number;
  location?: string;
  category?: string;
  size?: string;
  // The API includes other optional fields that we ignore.
  [key: string]: unknown;
}

interface FetchOpts {
  signal?: AbortSignal;
  // The passport indexer cycles every 5 min so a default revalidation window
  // of 60s is generous without being abusive. Override per-call as needed.
  revalidateSec?: number;
}

async function getJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${PASSPORT_API_BASE}${path}`;
  const res = await fetch(url, {
    signal: opts.signal,
    headers: { Accept: "application/json" },
    next:
      typeof window === "undefined"
        ? { revalidate: opts.revalidateSec ?? 60 }
        : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PassportApiError(res.status, `${path} -> HTTP ${res.status} ${text.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

export class PassportApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "PassportApiError";
  }
}

// ── Reads ──────────────────────────────────────────────────────────────────

export async function getOwnedPassports(
  owner: `0x${string}`,
  opts?: FetchOpts
): Promise<Passport[]> {
  if (!owner || owner === "0x0000000000000000000000000000000000000000") return [];
  return getJson<Passport[]>(`/passport?owner=${owner.toLowerCase()}`, opts);
}

// Returns the passport when the address is an iRWA, or null when 404.
// Other failures throw so callers can decide whether to retry.
export async function getPassportByToken(
  token: `0x${string}`,
  opts?: FetchOpts
): Promise<Passport | null> {
  try {
    return await getJson<Passport>(`/passport?token=${token.toLowerCase()}`, opts);
  } catch (e) {
    if (e instanceof PassportApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getPassportById(
  id: string,
  opts?: FetchOpts
): Promise<Passport | null> {
  try {
    return await getJson<Passport>(`/passport/${encodeURIComponent(id)}`, opts);
  } catch (e) {
    if (e instanceof PassportApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getPassportCount(opts?: FetchOpts): Promise<number> {
  const r = await getJson<{ count: number }>(`/passport/count`, opts);
  return Number(r.count);
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Picks the first usable image from a passport. The API returns an `images[]`
// of HTTPS URLs (it resolves the IPFS gateway server-side); just in case, we
// also handle ipfs:// strings.
export function passportImage(p: Passport | null | undefined): string | null {
  const imgs = p?.images;
  if (!Array.isArray(imgs)) return null;
  for (const img of imgs) {
    if (typeof img === "string" && img.trim()) return resolveIpfs(img);
  }
  return null;
}
