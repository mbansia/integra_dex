"use client";

import { useState, useMemo } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { TokenSelector } from "@/components/features/swap/token-selector";
import { ConnectModal } from "@/components/shared/connect-modal";
import { formatTokenAmount, parseTokenAmount } from "@/lib/utils";
import type { TokenInfo } from "@/lib/token-list";

const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const WIRL_ADDR = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;
function resolveAddr(addr: `0x${string}` | undefined): `0x${string}` | undefined {
  if (!addr) return addr;
  return addr === NATIVE ? WIRL_ADDR : addr;
}

export function AddLiquidityForm() {
  const { isConnected } = useWeb3();
  const [showConnect, setShowConnect] = useState(false);
  const { addLiquidity, isPending, error, success } = useLiquidity();

  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountAStr, setAmountAStr] = useState("");
  const [amountBStr, setAmountBStr] = useState("");
  const [selectorFor, setSelectorFor] = useState<"a" | "b" | null>(null);

  const amountA = useMemo(
    () => parseTokenAmount(amountAStr, tokenA?.decimals ?? 18),
    [amountAStr, tokenA]
  );
  const amountB = useMemo(
    () => parseTokenAmount(amountBStr, tokenB?.decimals ?? 18),
    [amountBStr, tokenB]
  );

  // Resolve IRL → WIRL for balance and approval
  const resolvedAddrA = resolveAddr(tokenA?.address);
  const resolvedAddrB = resolveAddr(tokenB?.address);

  const balanceA = useTokenBalance(tokenA?.address);
  const balanceB = useTokenBalance(tokenB?.address);
  const approvalA = useTokenApproval(resolvedAddrA);
  const approvalB = useTokenApproval(resolvedAddrB);

  const needsApprovalA = tokenA && amountA > 0n && !approvalA.isNative && approvalA.allowance < amountA;
  const needsApprovalB = tokenB && amountB > 0n && !approvalB.isNative && approvalB.allowance < amountB;

  const handleSubmit = async () => {
    if (!tokenA || !tokenB || amountA === 0n || amountB === 0n) return;
    await addLiquidity(tokenA.address, tokenB.address, amountA, amountB);
    if (!error) {
      setAmountAStr("");
      setAmountBStr("");
    }
  };

  const renderTokenInput = (
    label: string,
    token: TokenInfo | null,
    amount: string,
    setAmount: (v: string) => void,
    balance: bigint,
    side: "a" | "b"
  ) => (
    <div className="glass-card-elevated p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-plotswap-text-muted">{label}</span>
        {token && (
          <span className="text-xs text-plotswap-text-muted">
            Balance: {formatTokenAmount(balance, token.decimals, 4)}
          </span>
        )}
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
          className="flex-1 bg-transparent text-xl font-mono outline-none placeholder-plotswap-text-subtle"
        />
        <button
          onClick={() => setSelectorFor(side)}
          className="flex items-center gap-2 glass-card px-3 py-2 hover:border-plotswap-border-strong transition-colors whitespace-nowrap"
        >
          {token ? (
            <>
              <div className="w-6 h-6 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-[10px] font-bold text-plotswap-primary-light">
                {token.symbol.slice(0, 2)}
              </div>
              <span className="font-medium text-sm">{token.symbol}</span>
            </>
          ) : (
            <span className="text-sm text-plotswap-text-muted">Select</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <div className="glass-card p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-3">Add Liquidity</h2>

        {renderTokenInput("Token A", tokenA, amountAStr, setAmountAStr, balanceA, "a")}

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-lg bg-plotswap-bg border border-plotswap-border flex items-center justify-center text-plotswap-text-muted">
            +
          </div>
        </div>

        {renderTokenInput("Token B", tokenB, amountBStr, setAmountBStr, balanceB, "b")}

        {(error || approvalA.error || approvalB.error) && (
          <div className="px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
            {error || approvalA.error || approvalB.error}
          </div>
        )}

        {success && (
          <div className="px-3 py-2 rounded-lg bg-plotswap-success/10 border border-plotswap-success/20 text-plotswap-success text-xs">
            Liquidity added successfully!
          </div>
        )}

        <div className="pt-2 space-y-2">
          {needsApprovalA && !approvalA.isNative && (
            <button
              onClick={approvalA.approve}
              disabled={approvalA.isPending}
              className="btn-primary w-full py-3 text-sm"
            >
              {approvalA.isPending ? "Approving..." : `Approve ${tokenA!.symbol}`}
            </button>
          )}
          {needsApprovalB && !approvalB.isNative && (
            <button
              onClick={approvalB.approve}
              disabled={approvalB.isPending}
              className="btn-primary w-full py-3 text-sm"
            >
              {approvalB.isPending ? "Approving..." : `Approve ${tokenB!.symbol}`}
            </button>
          )}
          {!isConnected ? (
            <>
              <button onClick={() => setShowConnect(true)} className="btn-primary w-full py-3">
                Connect Wallet
              </button>
              <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={
                !tokenA ||
                !tokenB ||
                amountA === 0n ||
                amountB === 0n ||
                isPending ||
                !!needsApprovalA ||
                !!needsApprovalB
              }
              className="btn-primary w-full py-3"
            >
              {isPending ? "Supplying..." : "Supply Liquidity"}
            </button>
          )}
        </div>
      </div>

      <TokenSelector
        isOpen={selectorFor !== null}
        onClose={() => setSelectorFor(null)}
        onSelect={(token) => {
          if (selectorFor === "a") setTokenA(token);
          else setTokenB(token);
        }}
        excludeAddress={
          selectorFor === "a" ? tokenB?.address : tokenA?.address
        }
      />
    </div>
  );
}
