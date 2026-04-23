"use client";

export type XpKitSlug = "swap_tokens" | "add_liquidity";

export type XpRecordOutcome =
  | { ok: true; points: number; eventId: number }
  | { ok: false; code: string; message: string };

export async function recordXp(
  slug: XpKitSlug,
  userAddress: `0x${string}`,
  metadata: Record<string, unknown> = {},
  nonce?: string
): Promise<XpRecordOutcome> {
  try {
    const res = await fetch("/api/xp/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        userAddress: userAddress.toLowerCase(),
        metadata,
        nonce: nonce ?? `${slug}:${userAddress.toLowerCase()}:${Date.now()}`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      return {
        ok: false,
        code: data?.code ?? `HTTP_${res.status}`,
        message: data?.message ?? `XP record failed (${res.status})`,
      };
    }
    return {
      ok: true,
      points: Number(data?.points ?? 0),
      eventId: Number(data?.eventId ?? 0),
    };
  } catch (err: any) {
    return { ok: false, code: "NETWORK_ERROR", message: err?.message ?? "Network error" };
  }
}

export function friendlyXpNotice(
  outcome: XpRecordOutcome
): { title: string; message: string } | null {
  if (outcome.ok) return null;
  switch (outcome.code) {
    case "DAILY_CAP_REACHED":
      return {
        title: "Daily cap reached",
        message: "You won't earn more XP for this action today. Come back tomorrow.",
      };
    case "TOTAL_CAP_REACHED":
      return {
        title: "Lifetime cap reached",
        message: "You've earned the maximum XP for this action.",
      };
    case "COOLDOWN_ACTIVE":
      return {
        title: "Action on cooldown",
        message: "Try again in a moment.",
      };
    default:
      return null;
  }
}
