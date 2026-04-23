"use client";

import { useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useIRWATokens, useIRWAWrapper } from "@/hooks/useIRWAWrapper";
import { ConnectModal } from "@/components/shared/connect-modal";
import { formatTokenAmount, parseTokenAmount, shortenAddress, cn } from "@/lib/utils";

type Mode = "mint" | "wrapERC20" | "list";

export default function WrapRWAPage() {
  const { isConnected } = useWeb3();
  const { tokens, isLoading, refresh } = useIRWATokens();
  const { mintNew, wrapERC20, unwrap, isPending, error, success, lastMinted } =
    useIRWAWrapper();

  const [mode, setMode] = useState<Mode>("mint");
  const [showConnect, setShowConnect] = useState(false);

  const [mName, setMName] = useState("");
  const [mSymbol, setMSymbol] = useState("");
  const [mSupply, setMSupply] = useState("");
  const [mPassport, setMPassport] = useState("");

  const [wToken, setWToken] = useState("");
  const [wAmount, setWAmount] = useState("");
  const [wName, setWName] = useState("");
  const [wSymbol, setWSymbol] = useState("");
  const [wPassport, setWPassport] = useState("");

  return (
    <div className="max-w-4xl mx-auto pt-12 px-4 pb-24">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ps-text)" }}>
        iRWA Wrapper
      </h1>
      <p className="text-xs text-plotswap-text-muted mb-6">
        Mint a new iRWA token or wrap existing ERC-20 collateral into an iRWA.
      </p>

      <div className="glass-card p-4 mb-6">
        <div className="flex gap-1 mb-4 glass-card-elevated p-1 rounded-lg">
          {(["mint", "wrapERC20", "list"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                mode === m
                  ? "bg-plotswap-primary/15 text-plotswap-primary"
                  : "text-plotswap-text-muted"
              )}
            >
              {m === "mint" ? "Mint New" : m === "wrapERC20" ? "Wrap ERC-20" : "All iRWA"}
            </button>
          ))}
        </div>

        {mode === "mint" && (
          <div className="space-y-3">
            <Input label="Name" value={mName} onChange={setMName} placeholder="Manhattan Office Building Shares" />
            <Input label="Symbol" value={mSymbol} onChange={setMSymbol} placeholder="MOB" />
            <Input label="Supply (whole units)" value={mSupply} onChange={setMSupply} placeholder="1000000" inputMode="decimal" />
            <Input label="Passport URI" value={mPassport} onChange={setMPassport} placeholder="ipfs://... or https://..." />
            {!isConnected ? (
              <>
                <button className="btn-primary w-full py-3" onClick={() => setShowConnect(true)}>
                  Connect Wallet
                </button>
                <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
              </>
            ) : (
              <button
                onClick={async () => {
                  const supply = parseTokenAmount(mSupply, 18);
                  if (supply === 0n || !mName || !mSymbol) return;
                  const created = await mintNew(mName, mSymbol, supply, mPassport);
                  if (created) {
                    setMName(""); setMSymbol(""); setMSupply(""); setMPassport("");
                    refresh();
                  }
                }}
                disabled={isPending}
                className="btn-primary w-full py-3"
              >
                {isPending ? "Minting..." : "Mint iRWA"}
              </button>
            )}
          </div>
        )}

        {mode === "wrapERC20" && (
          <div className="space-y-3">
            <Input label="Underlying ERC-20 address" value={wToken} onChange={setWToken} placeholder="0x..." />
            <Input label="Amount (whole units)" value={wAmount} onChange={setWAmount} placeholder="100" inputMode="decimal" />
            <Input label="iRWA Name" value={wName} onChange={setWName} placeholder="Wrapped USDC Treasury Note" />
            <Input label="iRWA Symbol" value={wSymbol} onChange={setWSymbol} placeholder="wUST" />
            <Input label="Passport URI" value={wPassport} onChange={setWPassport} placeholder="ipfs://... or https://..." />
            {!isConnected ? (
              <>
                <button className="btn-primary w-full py-3" onClick={() => setShowConnect(true)}>
                  Connect Wallet
                </button>
                <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
              </>
            ) : (
              <button
                onClick={async () => {
                  const amt = parseTokenAmount(wAmount, 18);
                  if (amt === 0n || !/^0x[a-fA-F0-9]{40}$/.test(wToken) || !wName || !wSymbol) return;
                  const ok = await wrapERC20(wToken as `0x${string}`, amt, wName, wSymbol, wPassport);
                  if (ok) {
                    setWToken(""); setWAmount(""); setWName(""); setWSymbol(""); setWPassport("");
                    refresh();
                  }
                }}
                disabled={isPending}
                className="btn-primary w-full py-3"
              >
                {isPending ? "Wrapping..." : "Wrap ERC-20"}
              </button>
            )}
          </div>
        )}

        {mode === "list" && (
          <div>
            {isLoading ? (
              <p className="text-sm text-plotswap-text-muted py-6 text-center">Loading...</p>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-plotswap-text-muted py-6 text-center">
                No iRWA tokens minted yet.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--ps-border)" }}>
                {tokens.map((t) => (
                  <div key={t.address} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--ps-text)" }}>
                        {t.name} <span className="text-plotswap-text-muted">({t.symbol})</span>
                      </div>
                      <div className="text-xs text-plotswap-text-muted font-mono">
                        {shortenAddress(t.address)} · supply {formatTokenAmount(t.totalSupply, t.decimals, 2)}
                      </div>
                      {t.passportURI && (
                        <div className="text-[11px] text-plotswap-text-subtle truncate max-w-[400px]">
                          {t.passportURI}
                        </div>
                      )}
                    </div>
                    {isConnected && (
                      <button
                        onClick={async () => {
                          const ok = await unwrap(t.address);
                          if (ok) refresh();
                        }}
                        disabled={isPending}
                        className="text-xs font-medium text-plotswap-primary hover:underline"
                      >
                        Unwrap
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs px-3 py-2 rounded bg-plotswap-danger/10 text-plotswap-danger">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-xs px-3 py-2 rounded bg-plotswap-success/10 text-plotswap-success">
            {success}
            {lastMinted && ` — ${shortenAddress(lastMinted)}`}
          </p>
        )}
      </div>
    </div>
  );
}

function Input({
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
