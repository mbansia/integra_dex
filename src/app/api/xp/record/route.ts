import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const XP_KIT_URL = process.env.XP_KIT_URL;
const XP_KIT_API_KEY = process.env.XP_KIT_API_KEY;

type CatalogEntry = { id: number; slug: string; enabled: boolean };
type CachedCatalog = { entries: CatalogEntry[]; fetchedAt: number } | null;

const CATALOG_TTL_MS = 60_000;
let cachedCatalog: CachedCatalog = null;

async function loadCatalog(): Promise<CatalogEntry[]> {
  const now = Date.now();
  if (cachedCatalog && now - cachedCatalog.fetchedAt < CATALOG_TTL_MS) {
    return cachedCatalog.entries;
  }
  const res = await fetch(`${XP_KIT_URL}/actions?enabled=false`, {
    headers: {
      Authorization: `Bearer ${XP_KIT_API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`catalog fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as CatalogEntry[];
  cachedCatalog = { entries: json, fetchedAt: now };
  return json;
}

export async function POST(request: NextRequest) {
  if (!XP_KIT_URL || !XP_KIT_API_KEY) {
    return NextResponse.json(
      { code: "NOT_CONFIGURED", message: "XP Kit env vars missing on the server." },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Body must be valid JSON." },
      { status: 400 }
    );
  }

  const slug = String(body?.slug ?? "");
  const userAddress = String(body?.userAddress ?? "").toLowerCase();
  const nonce = String(body?.nonce ?? "");
  const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (!slug || !/^0x[a-f0-9]{40}$/.test(userAddress) || nonce.length < 8) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "slug, userAddress, and nonce (>=8 chars) are required." },
      { status: 400 }
    );
  }

  let actionId: number | undefined;
  try {
    const catalog = await loadCatalog();
    actionId = catalog.find((a) => a.slug === slug && a.enabled)?.id;
  } catch (err: any) {
    return NextResponse.json(
      { code: "CATALOG_UNAVAILABLE", message: err?.message ?? "Failed to reach XP Kit." },
      { status: 502 }
    );
  }
  if (!actionId) {
    return NextResponse.json(
      { code: "ACTION_NOT_FOUND", message: `No enabled action with slug '${slug}'. Register it first.` },
      { status: 404 }
    );
  }

  const res = await fetch(`${XP_KIT_URL}/xp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XP_KIT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ actionId, userAddress, metadata, nonce }),
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    const code = payload?.error?.code ?? `HTTP_${res.status}`;
    const message = payload?.error?.message ?? `XP Kit returned ${res.status}`;
    return NextResponse.json({ code, message }, { status: res.status });
  }

  return NextResponse.json({
    ok: true,
    points: payload?.points ?? 0,
    eventId: payload?.id ?? 0,
    actionSlug: payload?.actionSlug ?? slug,
  });
}
