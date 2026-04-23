"use client";

import { useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useLaunches, useBondingCurve, useBondingCurveQuote } from "@/hooks/useBondingCurve";
import { ConnectModal } from "@/components/shared/connect-modal";
import { formatTokenAmount, parseTokenAmount, shortenAddress, cn } from "@/lib/utils";

type Tab = "browse" | "create";

export default function LaunchPage() {
  const { isConnected } = useWeb3();
  const { launches, isLoading, refresh } = useLaunches();
  const { createLaunch, buy, sell, graduate, isPending, error, success } = useBondingCurve();

  const [tab, setTab] = useState<Tab>("browse");
  const [showConnect, setShowConnect] = useState(false);

  // Create form
  const [token, setToken] = useState("");
  const [payment, setPayment] = useState("0x0000000000000000000000000000000000000000");
  const [curveType, setCurveType] = useState("0");
  const [base, setBase] = useState("");
  const [slope, setSlope] = useState("");
  const [supplyCap, setSupplyCap] = useState("");
  const [graduation, setGraduation] = useState("");

  // Trade state (per-launch selection)
  const [selectedLaunchId, setSelectedLaunchId] = useState<bigint | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const parsedTradeAmount = parseTokenAmount(tradeAmount, 18);
  const quote = useBondingCurveQuote(selectedLaunchId, parsedTradeAmount, tradeMode);
  const selected = launches.find((l) => l.launchId === selectedLaunchId) ?? null;

  return (
    <div className="max-w-5xl mx-auto pt-12 px-4 pb-24">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ps-text)" }}>
        Bonding Curve Launches
      </h1>
      <p className="text-xs text-plotswap-text-muted mb-6">
        Price discovery on a curve. Graduates to the order book when reserves hit threshold.
      </p>

      <div className="flex gap-1 mb-4 glass-card-elevated p-1 rounded-lg w-fit">
        {(["browse", "create"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t ? "bg-plotswap-primary/15 text-plotswap-primary" : "text-plotswap-text-muted"
            )}
          >
            {t === "browse" ? "Browse" : "Create launch"}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass-card overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-plotswap-text-muted">Loading...</div>
            ) : launches.length === 0 ? (
              <div className="py-16 text-center text-sm text-plotswap-text-muted">No launches yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--ps-border)" }}>
                {launches.map((l) => (
                  <button
                    key={String(l.launchId)}
                    onClick={() => setSelectedLaunchId(l.launchId)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-plotswap-primary/5 transition-colors",
                      selectedLaunchId === l.launchId && "bg-plotswap-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--ps-text)" }}>
                          Launch #{String(l.launchId)} {l.graduated && <span className="text-plotswap-success">· graduated</span>}
                        </div>
                        <div className="text-xs text-plotswap-text-muted font-mono">
                          token {shortenAddress(l.token)} · pay {shortenAddress(l.paymentToken)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-plotswap-text-muted">
                        <div>reserve {formatTokenAmount(l.reserve, 18, 2)}</div>
                        <div>sold {formatTokenAmount(l.sold, 18, 2)} / {formatTokenAmount(l.supplyCap, 18, 2)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-4">
            {!selected ? (
              <div className="py-16 text-center text-sm text-plotswap-text-muted">
                Select a launch to trade on the curve.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--ps-text)" }}>
                    Launch #{String(selected.launchId)}
                  </div>
                  <div className="text-xs text-plotswap-text-muted font-mono">
                    token {shortenAddress(selected.token)}
                  </div>
                </div>
                <div className="flex gap-1 glass-card-elevated p-1 rounded-lg">
                  {(["buy", "sell"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTradeMode(m)}
                      className={cn(
                        "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                        tradeMode === m ? "bg-plotswap-primary/15 text-plotswap-primary" : "text-plotswap-text-muted"
                      )}
                    >
                      {m === "buy" ? "Buy" : "Sell"}
                    </button>
                  ))}
                </div>
                <label className="block">
                  <span className="text-xs text-plotswap-text-muted block mb-1">Amount of tokens</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="input-field w-full px-3 py-2 text-sm font-mono"
                    placeholder="0.0"
                  />
                </label>
                <div className="text-xs text-plotswap-text-muted glass-card-elevated p-3 rounded-md space-y-1">
                  <div className="flex justify-between">
                    <span>{tradeMode === "buy" ? "Max cost" : "Min refund"}</span>
                    <span className="font-mono">{formatTokenAmount(quote.cost, 18, 6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New unit price</span>
                    <span className="font-mono">{formatTokenAmount(quote.newPrice, 18, 6)}</span>
                  </div>
                </div>
                {!isConnected ? (
                  <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (parsedTradeAmount === 0n) return;
                      const ok =
                        tradeMode === "buy"
                          ? await buy(selected, parsedTradeAmount, quote.cost)
                          : await sell(selected.launchId, parsedTradeAmount, quote.cost);
                      if (ok) { setTradeAmount(""); refresh(); }
                    }}
                    disabled={isPending || parsedTradeAmount === 0n}
                    className="btn-primary w-full py-3"
                  >
                    {isPending ? "Processing..." : tradeMode === "buy" ? "Buy on curve" : "Sell on curve"}
                  </button>
                )}
                {!selected.graduated && (
                  <button
                    onClick={async () => { const ok = await graduate(selected.launchId); if (ok) refresh(); }}
                    disabled={isPending}
                    className="w-full py-2 text-xs text-plotswap-text-muted hover:text-plotswap-primary transition-colors"
                  >
                    Trigger graduation
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "create" && (
        <div className="glass-card p-4 space-y-3 max-w-lg">
          <LabeledInput label="Token to launch (address)" value={token} onChange={setToken} placeholder="0x..." />
          <LabeledInput label="Payment token (0x0 for native IRL)" value={payment} onChange={setPayment} />
          <LabeledInput label="Curve type (0=linear, 1=exp, ...)" value={curveType} onChange={setCurveType} inputMode="decimal" />
          <LabeledInput label="Base price" value={base} onChange={setBase} inputMode="decimal" />
          <LabeledInput label="Slope" value={slope} onChange={setSlope} inputMode="decimal" />
          <LabeledInput label="Supply cap" value={supplyCap} onChange={setSupplyCap} inputMode="decimal" />
          <LabeledInput label="Graduation threshold" value={graduation} onChange={setGraduation} inputMode="decimal" />
          {!isConnected ? (
            <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">Connect Wallet</button>
          ) : (
            <button
              onClick={async () => {
                if (!/^0x[a-fA-F0-9]{40}$/.test(token)) return;
                const ok = await createLaunch(
                  token as `0x${string}`,
                  payment as `0x${string}`,
                  Number(curveType || "0"),
                  parseTokenAmount(base, 18),
                  parseTokenAmount(slope, 18),
                  parseTokenAmount(supplyCap, 18),
                  parseTokenAmount(graduation, 18)
                );
                if (ok) { setToken(""); setBase(""); setSlope(""); setSupplyCap(""); setGraduation(""); refresh(); }
              }}
              disabled={isPending}
              className="btn-primary w-full py-3"
            >
              {isPending ? "Creating..." : "Create launch"}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-xs px-3 py-2 rounded bg-plotswap-danger/10 text-plotswap-danger">{error}</p>}
      {success && <p className="mt-4 text-xs px-3 py-2 rounded bg-plotswap-success/10 text-plotswap-success">{success}</p>}

      <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "text";
}) {
  return (
    <label className="block">
      <span className="text-xs text-plotswap-text-muted block mb-1">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-field w-full px-3 py-2 text-sm font-mono"
      />
    </label>
  );
}
