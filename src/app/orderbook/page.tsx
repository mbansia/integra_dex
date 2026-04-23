"use client";

import { useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useOrderBook, useOrderBookActions } from "@/hooks/useOrderBook";
import { ConnectModal } from "@/components/shared/connect-modal";
import { formatTokenAmount, parseTokenAmount, shortenAddress, cn } from "@/lib/utils";

type Tab = "browse" | "list";

export default function OrderBookPage() {
  const { isConnected, address } = useWeb3();
  const { orders, isLoading, refresh } = useOrderBook();
  const {
    listAsset,
    cancelListing,
    placeMarketOrder,
    isPending,
    error,
    success,
  } = useOrderBookActions();

  const [tab, setTab] = useState<Tab>("browse");
  const [showConnect, setShowConnect] = useState(false);

  const [sellToken, setSellToken] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [priceIRL, setPriceIRL] = useState("");
  const [priceTUSDI, setPriceTUSDI] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");

  return (
    <div className="max-w-5xl mx-auto pt-12 px-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ps-text)" }}>
            Global Order Book
          </h1>
          <p className="text-xs text-plotswap-text-muted mt-1">
            List any token for sale, buy at ask, or negotiate.
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 glass-card-elevated p-1 rounded-lg w-fit">
        {(["browse", "list"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t
                ? "bg-plotswap-primary/15 text-plotswap-primary"
                : "text-plotswap-text-muted"
            )}
          >
            {t === "browse" ? "Browse" : "List asset"}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">
              No active listings.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs" style={{ borderColor: "var(--ps-border)", color: "var(--ps-text-muted)" }}>
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">Seller</th>
                  <th className="text-left py-3 px-4 font-medium">Token</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 font-medium">Price IRL</th>
                  <th className="text-right py-3 px-4 font-medium">Price TUSDI</th>
                  <th className="text-right py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isMine = address && o.maker.toLowerCase() === address.toLowerCase();
                  return (
                    <tr key={String(o.orderId)} className="border-b" style={{ borderColor: "var(--ps-border)" }}>
                      <td className="py-3 px-4 text-xs text-plotswap-text-muted font-mono">{String(o.orderId)}</td>
                      <td className="py-3 px-4 text-xs font-mono text-plotswap-text-muted">{shortenAddress(o.maker)}</td>
                      <td className="py-3 px-4 text-xs font-mono">{shortenAddress(o.sellToken)}</td>
                      <td className="py-3 px-4 text-right text-xs font-mono">{formatTokenAmount(o.sellAmount, 18, 4)}</td>
                      <td className="py-3 px-4 text-right text-xs font-mono">{o.priceInIRL > 0n ? formatTokenAmount(o.priceInIRL, 18, 4) : "-"}</td>
                      <td className="py-3 px-4 text-right text-xs font-mono">{o.priceInTUSDI > 0n ? formatTokenAmount(o.priceInTUSDI, 18, 4) : "-"}</td>
                      <td className="py-3 px-4 text-right">
                        {!isConnected ? (
                          <button onClick={() => setShowConnect(true)} className="text-xs text-plotswap-primary">Connect</button>
                        ) : isMine ? (
                          <button
                            onClick={async () => { const ok = await cancelListing(o.orderId); if (ok) refresh(); }}
                            disabled={isPending}
                            className="text-xs text-plotswap-danger hover:underline"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              const ok = await placeMarketOrder(o.orderId, 0, o.priceInIRL);
                              if (ok) refresh();
                            }}
                            disabled={isPending || o.priceInIRL === 0n}
                            className="text-xs text-plotswap-primary hover:underline disabled:opacity-50"
                          >
                            Buy IRL
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "list" && (
        <div className="glass-card p-4 space-y-3 max-w-lg">
          <LabeledInput label="Token address" value={sellToken} onChange={setSellToken} placeholder="0x..." />
          <LabeledInput label="Amount" value={sellAmount} onChange={setSellAmount} placeholder="100" inputMode="decimal" />
          <LabeledInput label="Price in IRL (0 to disable)" value={priceIRL} onChange={setPriceIRL} placeholder="0" inputMode="decimal" />
          <LabeledInput label="Price in TUSDI (0 to disable)" value={priceTUSDI} onChange={setPriceTUSDI} placeholder="0" inputMode="decimal" />
          <LabeledInput label="Expires in (days)" value={expiresInDays} onChange={setExpiresInDays} placeholder="7" inputMode="decimal" />

          {!isConnected ? (
            <>
              <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">Connect Wallet</button>
              <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
            </>
          ) : (
            <button
              onClick={async () => {
                if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken)) return;
                const amt = parseTokenAmount(sellAmount, 18);
                const pI = parseTokenAmount(priceIRL || "0", 18);
                const pT = parseTokenAmount(priceTUSDI || "0", 18);
                const days = Number(expiresInDays || "0");
                if (amt === 0n || (pI === 0n && pT === 0n) || days <= 0) return;
                const expires = BigInt(Math.floor(Date.now() / 1000) + days * 86400);
                const ok = await listAsset(sellToken as `0x${string}`, amt, 0n, pI, pT, expires);
                if (ok) {
                  setSellToken(""); setSellAmount(""); setPriceIRL(""); setPriceTUSDI("");
                  refresh();
                }
              }}
              disabled={isPending}
              className="btn-primary w-full py-3"
            >
              {isPending ? "Listing..." : "List asset"}
            </button>
          )}

          {error && <p className="text-xs px-3 py-2 rounded bg-plotswap-danger/10 text-plotswap-danger">{error}</p>}
          {success && <p className="text-xs px-3 py-2 rounded bg-plotswap-success/10 text-plotswap-success">{success}</p>}
        </div>
      )}

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
