"use client";

import { useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useAgents, useAgentAuth } from "@/hooks/useAgentAuth";
import { ConnectModal } from "@/components/shared/connect-modal";
import { parseTokenAmount, cn } from "@/lib/utils";

type Tab = "mine" | "register" | "authorize";

export default function AgentsPage() {
  const { isConnected } = useWeb3();
  const { agents, isLoading, refresh } = useAgents();
  const {
    registerAgent,
    pauseAgent,
    resumeAgent,
    deactivateAgent,
    authorize,
    revoke,
    isPending,
    error,
    success,
  } = useAgentAuth();

  const [tab, setTab] = useState<Tab>("mine");
  const [showConnect, setShowConnect] = useState(false);

  const [rName, setRName] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rEndpoint, setREndpoint] = useState("");

  const [aAgent, setAAgent] = useState("");
  const [aSelectors, setASelectors] = useState("");
  const [aSpendLimit, setASpendLimit] = useState("");

  return (
    <div className="max-w-4xl mx-auto pt-12 px-4 pb-24">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ps-text)" }}>
        Agents
      </h1>
      <p className="text-xs text-plotswap-text-muted mb-6">
        Register agents to act on behalf of users, and authorize specific function selectors.
      </p>

      <div className="flex gap-1 mb-4 glass-card-elevated p-1 rounded-lg w-fit">
        {(["mine", "register", "authorize"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t ? "bg-plotswap-primary/15 text-plotswap-primary" : "text-plotswap-text-muted"
            )}
          >
            {t === "mine" ? "My Agents" : t === "register" ? "Register" : "Authorize"}
          </button>
        ))}
      </div>

      {tab === "mine" && (
        <div className="glass-card overflow-hidden">
          {!isConnected ? (
            <div className="py-16 text-center">
              <button onClick={() => setShowConnect(true)} className="btn-primary px-4 py-2 text-sm">
                Connect Wallet
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">Loading...</div>
          ) : agents.length === 0 ? (
            <div className="py-16 text-center text-sm text-plotswap-text-muted">
              You have not registered any agents yet.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--ps-border)" }}>
              {agents.map((a) => (
                <div key={String(a.agentId)} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--ps-text)" }}>
                      #{String(a.agentId)} · {a.name}{" "}
                      {!a.active && <span className="text-plotswap-danger text-xs">(inactive)</span>}
                    </div>
                    <div className="text-xs text-plotswap-text-muted">{a.description}</div>
                    {a.endpointURI && (
                      <div className="text-[11px] text-plotswap-text-subtle truncate max-w-[400px]">
                        {a.endpointURI}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => { const ok = await pauseAgent(a.agentId); if (ok) refresh(); }}
                      disabled={isPending}
                      className="text-xs text-plotswap-text-muted hover:underline"
                    >
                      Pause
                    </button>
                    <button
                      onClick={async () => { const ok = await resumeAgent(a.agentId); if (ok) refresh(); }}
                      disabled={isPending}
                      className="text-xs text-plotswap-primary hover:underline"
                    >
                      Resume
                    </button>
                    <button
                      onClick={async () => { const ok = await deactivateAgent(a.agentId); if (ok) refresh(); }}
                      disabled={isPending}
                      className="text-xs text-plotswap-danger hover:underline"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "register" && (
        <div className="glass-card p-4 space-y-3 max-w-lg">
          <LabeledInput label="Name" value={rName} onChange={setRName} placeholder="My trading bot" />
          <LabeledInput label="Description" value={rDesc} onChange={setRDesc} placeholder="..." />
          <LabeledInput label="Endpoint URI" value={rEndpoint} onChange={setREndpoint} placeholder="https://..." />
          {!isConnected ? (
            <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">Connect Wallet</button>
          ) : (
            <button
              onClick={async () => {
                if (!rName) return;
                const ok = await registerAgent(rName, rDesc, rEndpoint);
                if (ok) { setRName(""); setRDesc(""); setREndpoint(""); refresh(); }
              }}
              disabled={isPending}
              className="btn-primary w-full py-3"
            >
              {isPending ? "Registering..." : "Register agent"}
            </button>
          )}
        </div>
      )}

      {tab === "authorize" && (
        <div className="glass-card p-4 space-y-3 max-w-lg">
          <LabeledInput label="Agent address" value={aAgent} onChange={setAAgent} placeholder="0x..." />
          <LabeledInput
            label="Selectors (comma-separated 4-byte hex, e.g. 0xa9059cbb)"
            value={aSelectors}
            onChange={setASelectors}
            placeholder="0xa9059cbb,0x095ea7b3"
          />
          <LabeledInput label="Spend limit (whole units)" value={aSpendLimit} onChange={setASpendLimit} inputMode="decimal" placeholder="100" />
          {!isConnected ? (
            <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">Connect Wallet</button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!/^0x[a-fA-F0-9]{40}$/.test(aAgent)) return;
                  const selectors = aSelectors
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => /^0x[a-fA-F0-9]{8}$/.test(s)) as `0x${string}`[];
                  if (selectors.length === 0) return;
                  const spend = parseTokenAmount(aSpendLimit || "0", 18);
                  const ok = await authorize(aAgent as `0x${string}`, selectors, spend);
                  if (ok) { setAAgent(""); setASelectors(""); setASpendLimit(""); }
                }}
                disabled={isPending}
                className="btn-primary flex-1 py-3"
              >
                {isPending ? "Authorizing..." : "Authorize"}
              </button>
              <button
                onClick={async () => {
                  if (!/^0x[a-fA-F0-9]{40}$/.test(aAgent)) return;
                  await revoke(aAgent as `0x${string}`);
                }}
                disabled={isPending}
                className="flex-1 py-3 rounded-lg border text-sm font-medium text-plotswap-danger border-plotswap-danger/30 hover:bg-plotswap-danger/10"
              >
                Revoke
              </button>
            </div>
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

