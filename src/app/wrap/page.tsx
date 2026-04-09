"use client";

import { useState } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { WIRL_ABI } from "@/lib/abis/WIRL";
import { formatTokenAmount, parseTokenAmount, cn } from "@/lib/utils";
import { ConnectModal } from "@/components/shared/connect-modal";

const WIRL_ADDRESS = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;
const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default function WrapPage() {
  const { isConnected, address, walletClient, publicClient } = useWeb3();
  const [tab, setTab] = useState<"wrap" | "unwrap">("wrap");
  const [amount, setAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const irlBalance = useTokenBalance(NATIVE);
  const wirlBalance = useTokenBalance(WIRL_ADDRESS);

  const parsedAmount = parseTokenAmount(amount, 18);

  const handleWrap = async () => {
    if (!walletClient || !address || parsedAmount === 0n) return;
    setIsPending(true);
    setError(null);
    setSuccess(null);
    try {
      const hash = await walletClient.writeContract({
        address: WIRL_ADDRESS,
        abi: WIRL_ABI,
        functionName: "deposit",
        value: parsedAmount,
        account: address,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setSuccess(`Wrapped ${amount} IRL to WIRL`);
      setAmount("");
    } catch (err: any) {
      setError(err?.shortMessage || "Wrap failed");
    }
    setIsPending(false);
  };

  const handleUnwrap = async () => {
    if (!walletClient || !address || parsedAmount === 0n) return;
    setIsPending(true);
    setError(null);
    setSuccess(null);
    try {
      const hash = await walletClient.writeContract({
        address: WIRL_ADDRESS,
        abi: WIRL_ABI,
        functionName: "withdraw",
        args: [parsedAmount],
        account: address,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setSuccess(`Unwrapped ${amount} WIRL to IRL`);
      setAmount("");
    } catch (err: any) {
      setError(err?.shortMessage || "Unwrap failed");
    }
    setIsPending(false);
  };

  const balance = tab === "wrap" ? irlBalance : wirlBalance;
  const fromSymbol = tab === "wrap" ? "IRL" : "WIRL";
  const toSymbol = tab === "wrap" ? "WIRL" : "IRL";

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-8rem)] pt-12 px-4">
      <div className="w-full max-w-[420px]">
        <div className="glass-card p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 glass-card-elevated p-1 rounded-lg">
            <button
              onClick={() => { setTab("wrap"); setAmount(""); setError(null); setSuccess(null); }}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                tab === "wrap" ? "bg-plotswap-primary/15 text-plotswap-primary" : "text-plotswap-text-muted"
              )}
            >
              Wrap IRL
            </button>
            <button
              onClick={() => { setTab("unwrap"); setAmount(""); setError(null); setSuccess(null); }}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                tab === "unwrap" ? "bg-plotswap-primary/15 text-plotswap-primary" : "text-plotswap-text-muted"
              )}
            >
              Unwrap WIRL
            </button>
          </div>

          {/* Input */}
          <div className="glass-card-elevated p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-plotswap-text-muted">From: {fromSymbol}</span>
              <span className="text-xs text-plotswap-text-muted">
                Balance: {formatTokenAmount(balance, 18, 4)}
                <button
                  onClick={() => setAmount(formatTokenAmount(balance, 18, 18))}
                  className="ml-1 text-plotswap-primary"
                >
                  MAX
                </button>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  if (val.split(".").length <= 2) setAmount(val);
                }}
                className="flex-1 bg-transparent text-2xl font-mono outline-none text-plotswap-text placeholder-plotswap-text-subtle"
              />
              <div className="glass-card px-3 py-2 text-sm font-medium text-plotswap-text">
                {fromSymbol}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-plotswap-bg border border-plotswap-border flex items-center justify-center text-plotswap-text-muted">
              ↓
            </div>
          </div>

          {/* Output preview */}
          <div className="glass-card-elevated p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-plotswap-text-muted">To: {toSymbol}</span>
            </div>
            <div className="text-2xl font-mono text-plotswap-text">
              {amount || "0.0"}
            </div>
            <p className="text-[11px] text-plotswap-text-subtle mt-2">
              1 IRL = 1 WIRL (always 1:1)
            </p>
          </div>

          {/* Status */}
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-success/10 border border-plotswap-success/20 text-plotswap-success text-xs">
              {success}
            </div>
          )}

          {/* Action */}
          {!isConnected ? (
            <>
              <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-4 text-base">
                Connect Wallet
              </button>
              <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
            </>
          ) : (
            <button
              onClick={tab === "wrap" ? handleWrap : handleUnwrap}
              disabled={isPending || parsedAmount === 0n}
              className="btn-primary w-full py-4 text-base"
            >
              {isPending ? (tab === "wrap" ? "Wrapping..." : "Unwrapping...") : `${tab === "wrap" ? "Wrap" : "Unwrap"} ${fromSymbol}`}
            </button>
          )}
        </div>

        <p className="text-xs text-plotswap-text-subtle text-center mt-4">
          WIRL is required for swaps and liquidity pools. Wrap your IRL 1:1 to get started.
        </p>
      </div>
    </div>
  );
}
