"use client";

import { useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useSplitAssets, useYieldSplitter, useAccruedYield } from "@/hooks/useYieldSplitter";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { ConnectModal } from "@/components/shared/connect-modal";
import { formatTokenAmount, parseTokenAmount, shortenAddress, cn } from "@/lib/utils";

export default function YieldPage() {
  const { isConnected } = useWeb3();
  const { assets, isLoading, refresh } = useSplitAssets();
  const { split, merge, claimYield, isPending, error, success } = useYieldSplitter();
  const [showConnect, setShowConnect] = useState(false);
  const [selectedIrwa, setSelectedIrwa] = useState<`0x${string}` | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"split" | "merge">("split");

  const selected = assets.find((a) => a.irwaToken === selectedIrwa) ?? assets[0] ?? null;
  const irwaBalance = useTokenBalance(selected?.irwaToken);
  const ptBalance = useTokenBalance(selected?.pt);
  const ytBalance = useTokenBalance(selected?.yt);
  const { amount: accrued, refresh: refreshAccrued } = useAccruedYield(selected?.irwaToken ?? null);

  const parsedAmount = parseTokenAmount(amount, 18);

  return (
    <div className="max-w-5xl mx-auto pt-12 px-4 pb-24">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ps-text)" }}>
        Yield Splitter
      </h1>
      <p className="text-xs text-plotswap-text-muted mb-6">
        Split iRWA into Principal Token (PT) and Yield Token (YT). Claim accrued yield separately.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b text-xs text-plotswap-text-muted" style={{ borderColor: "var(--ps-border)" }}>
            Split Assets
          </div>
          {isLoading ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">
              No assets have been split yet.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--ps-border)" }}>
              {assets.map((a) => (
                <button
                  key={a.irwaToken}
                  onClick={() => setSelectedIrwa(a.irwaToken)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-plotswap-primary/5 transition-colors",
                    (selected?.irwaToken ?? null) === a.irwaToken && "bg-plotswap-primary/10"
                  )}
                >
                  <div className="text-sm font-medium" style={{ color: "var(--ps-text)" }}>
                    {a.name} <span className="text-plotswap-text-muted">({a.symbol})</span>
                  </div>
                  <div className="text-xs text-plotswap-text-muted font-mono">
                    iRWA {shortenAddress(a.irwaToken)} · PT {shortenAddress(a.pt)} · YT {shortenAddress(a.yt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          {!selected ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">
              Select an iRWA to split or merge.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium" style={{ color: "var(--ps-text)" }}>
                {selected.name} ({selected.symbol})
              </div>

              <div className="glass-card-elevated p-3 rounded-md text-xs text-plotswap-text-muted space-y-1">
                <div className="flex justify-between"><span>iRWA balance</span><span className="font-mono">{formatTokenAmount(irwaBalance, 18, 4)}</span></div>
                <div className="flex justify-between"><span>PT balance</span><span className="font-mono">{formatTokenAmount(ptBalance, 18, 4)}</span></div>
                <div className="flex justify-between"><span>YT balance</span><span className="font-mono">{formatTokenAmount(ytBalance, 18, 4)}</span></div>
                <div className="flex justify-between border-t pt-1 mt-1" style={{ borderColor: "var(--ps-border)" }}>
                  <span>Accrued yield</span>
                  <span className="font-mono">{formatTokenAmount(accrued, 18, 6)}</span>
                </div>
              </div>

              <div className="flex gap-1 glass-card-elevated p-1 rounded-lg">
                {(["split", "merge"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                      mode === m ? "bg-plotswap-primary/15 text-plotswap-primary" : "text-plotswap-text-muted"
                    )}
                  >
                    {m === "split" ? "Split iRWA → PT+YT" : "Merge PT+YT → iRWA"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-xs text-plotswap-text-muted block mb-1">Amount</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="input-field w-full px-3 py-2 text-sm font-mono"
                  placeholder="0.0"
                />
              </label>

              {!isConnected ? (
                <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">
                  Connect Wallet
                </button>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      if (parsedAmount === 0n) return;
                      const ok =
                        mode === "split"
                          ? await split(selected.irwaToken, parsedAmount)
                          : await merge(selected.irwaToken, parsedAmount);
                      if (ok) { setAmount(""); refresh(); }
                    }}
                    disabled={isPending || parsedAmount === 0n}
                    className="btn-primary w-full py-3"
                  >
                    {isPending ? "Processing..." : mode === "split" ? "Split" : "Merge"}
                  </button>

                  <button
                    onClick={async () => {
                      const ok = await claimYield(selected.irwaToken);
                      if (ok) { refreshAccrued(); }
                    }}
                    disabled={isPending || accrued === 0n}
                    className="w-full py-2 text-xs text-plotswap-primary hover:underline disabled:opacity-50"
                  >
                    Claim accrued yield
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-xs px-3 py-2 rounded bg-plotswap-danger/10 text-plotswap-danger">{error}</p>}
      {success && <p className="mt-4 text-xs px-3 py-2 rounded bg-plotswap-success/10 text-plotswap-success">{success}</p>}

      <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
    </div>
  );
}
