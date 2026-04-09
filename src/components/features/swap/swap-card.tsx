"use client";

import { useState, useMemo } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useSwap } from "@/hooks/useSwap";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useTransferRestriction } from "@/hooks/useTransferRestriction";
import { TokenSelector } from "./token-selector";
import { SwapSettings } from "./swap-settings";
import { PriceImpact } from "./price-impact";
import {
  formatTokenAmount,
  parseTokenAmount,
  calculatePriceImpact,
} from "@/lib/utils";
import { CONTRACTS } from "@/lib/contracts";
import type { TokenInfo } from "@/lib/token-list";

import { ConnectModal } from "@/components/shared/connect-modal";

export function SwapCard() {
  const { isConnected } = useWeb3();

  const [tokenIn, setTokenIn] = useState<TokenInfo | null>(null);
  const [tokenOut, setTokenOut] = useState<TokenInfo | null>(null);
  const [amountInStr, setAmountInStr] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);

  const [selectorFor, setSelectorFor] = useState<"in" | "out" | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  const amountIn = useMemo(
    () => parseTokenAmount(amountInStr, tokenIn?.decimals ?? 18),
    [amountInStr, tokenIn]
  );

  const { amountOut, isQuoting, isSwapping, error, swap } = useSwap(
    tokenIn?.address,
    tokenOut?.address,
    amountIn
  );

  const balanceIn = useTokenBalance(tokenIn?.address);
  const balanceOut = useTokenBalance(tokenOut?.address);
  const { allowance, approve, isPending: isApproving } = useTokenApproval(
    tokenIn?.address
  );

  const needsApproval = tokenIn && amountIn > 0n && allowance < amountIn;
  const insufficientBalance = tokenIn && amountIn > 0n && balanceIn < amountIn;

  // ERC-1404 pre-checks: verify sender can send tokenIn, and can receive tokenOut
  const { address } = useWeb3();
  const pairAddress = CONTRACTS.Factory !== "0x" ? CONTRACTS.Router : undefined;

  const sendRestriction = useTransferRestriction(
    tokenIn?.address,
    address ?? undefined,
    pairAddress,
    amountIn,
    tokenIn?.isERC1404 ?? false
  );

  const receiveRestriction = useTransferRestriction(
    tokenOut?.address,
    pairAddress,
    address ?? undefined,
    amountOut,
    tokenOut?.isERC1404 ?? false
  );

  const hasRestriction = sendRestriction.restricted || receiveRestriction.restricted;
  const restrictionMessage = sendRestriction.restricted
    ? `${tokenIn?.symbol}: ${sendRestriction.message}`
    : receiveRestriction.restricted
      ? `${tokenOut?.symbol}: ${receiveRestriction.message}`
      : null;
  const isCheckingRestriction = sendRestriction.isChecking || receiveRestriction.isChecking;

  const priceImpact = useMemo(() => {
    if (!amountIn || !amountOut) return 0;
    // Simplified — actual would use reserves
    return calculatePriceImpact(amountIn, amountOut, amountIn * 100n, amountOut * 100n);
  }, [amountIn, amountOut]);

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountInStr("");
  };

  const buttonState = useMemo(() => {
    if (!isConnected) return { label: "Connect Wallet", action: () => setShowConnect(true), disabled: false };
    if (!tokenIn || !tokenOut) return { label: "Select tokens", action: undefined, disabled: true };
    if (!amountInStr || amountIn === 0n) return { label: "Enter an amount", action: undefined, disabled: true };
    if (insufficientBalance) return { label: "Insufficient balance", action: undefined, disabled: true };
    if (isCheckingRestriction) return { label: "Checking permissions...", action: undefined, disabled: true };
    if (hasRestriction) return { label: "Transfer restricted", action: undefined, disabled: true };
    if (needsApproval) return { label: isApproving ? "Approving..." : `Approve ${tokenIn.symbol}`, action: approve, disabled: isApproving };
    if (isSwapping) return { label: "Swapping...", action: undefined, disabled: true };
    if (error) return { label: "Swap", action: () => swap(slippage * 100), disabled: false };
    return { label: "Swap", action: () => swap(slippage * 100), disabled: isQuoting };
  }, [isConnected, tokenIn, tokenOut, amountInStr, amountIn, insufficientBalance, isCheckingRestriction, hasRestriction, needsApproval, isApproving, isSwapping, isQuoting, error, slippage, approve, swap]);

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <div className="glass-card p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-lg font-semibold">Swap</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-plotswap-text-muted hover:text-plotswap-text transition-colors p-1"
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8.325 2.317a.75.75 0 011.35 0l.688 1.378a.75.75 0 00.58.412l1.528.181a.75.75 0 01.418 1.286l-1.12.996a.75.75 0 00-.22.687l.305 1.51a.75.75 0 01-1.094.793L9.4 8.87a.75.75 0 00-.72 0l-1.36.69a.75.75 0 01-1.094-.793l.305-1.51a.75.75 0 00-.22-.687l-1.12-.996a.75.75 0 01.418-1.286l1.528-.181a.75.75 0 00.58-.412l.688-1.378z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="10" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <SwapSettings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            slippage={slippage}
            setSlippage={setSlippage}
            deadline={deadline}
            setDeadline={setDeadline}
          />
        </div>

        {/* Token In */}
        <div className="glass-card-elevated p-4 mb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-plotswap-text-muted">You pay</span>
            {tokenIn && (
              <span className="text-xs text-plotswap-text-muted">
                Balance: {formatTokenAmount(balanceIn, tokenIn.decimals, 4)}
                <button
                  onClick={() =>
                    setAmountInStr(formatTokenAmount(balanceIn, tokenIn.decimals, tokenIn.decimals))
                  }
                  className="ml-1 text-plotswap-primary-light hover:text-plotswap-primary"
                >
                  MAX
                </button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amountInStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                if (val.split(".").length <= 2) setAmountInStr(val);
              }}
              className="flex-1 bg-transparent text-2xl font-mono outline-none placeholder-plotswap-text-subtle"
            />
            <button
              onClick={() => setSelectorFor("in")}
              className="flex items-center gap-2 glass-card px-3 py-2 hover:border-plotswap-border-strong transition-colors whitespace-nowrap"
            >
              {tokenIn ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-[10px] font-bold text-plotswap-primary-light">
                    {tokenIn.symbol.slice(0, 2)}
                  </div>
                  <span className="font-medium text-sm">{tokenIn.symbol}</span>
                </>
              ) : (
                <span className="text-sm text-plotswap-text-muted">Select</span>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-plotswap-text-muted">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Flip Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleFlip}
            className="w-10 h-10 rounded-xl bg-plotswap-bg border border-plotswap-border flex items-center justify-center hover:border-plotswap-primary/30 hover:bg-plotswap-primary/5 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M8 14l-3-3M8 14l3-3M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Token Out */}
        <div className="glass-card-elevated p-4 mt-1 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-plotswap-text-muted">You receive</span>
            {tokenOut && (
              <span className="text-xs text-plotswap-text-muted">
                Balance: {formatTokenAmount(balanceOut, tokenOut.decimals, 4)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-mono text-plotswap-text-muted">
              {isQuoting ? (
                <span className="animate-pulse">...</span>
              ) : amountOut > 0n && tokenOut ? (
                <span className="text-plotswap-text">
                  {formatTokenAmount(amountOut, tokenOut.decimals)}
                </span>
              ) : (
                "0.0"
              )}
            </div>
            <button
              onClick={() => setSelectorFor("out")}
              className="flex items-center gap-2 glass-card px-3 py-2 hover:border-plotswap-border-strong transition-colors whitespace-nowrap"
            >
              {tokenOut ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-plotswap-accent/20 flex items-center justify-center text-[10px] font-bold text-plotswap-accent">
                    {tokenOut.symbol.slice(0, 2)}
                  </div>
                  <span className="font-medium text-sm">{tokenOut.symbol}</span>
                </>
              ) : (
                <span className="text-sm text-plotswap-text-muted">Select</span>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-plotswap-text-muted">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Details */}
        {amountOut > 0n && tokenIn && tokenOut && (
          <div className="space-y-2 mb-4 px-1">
            <div className="flex justify-between text-xs">
              <span className="text-plotswap-text-muted">Rate</span>
              <span className="font-mono">
                1 {tokenIn.symbol} ={" "}
                {amountIn > 0n
                  ? (Number(amountOut) / Number(amountIn)).toFixed(6)
                  : "—"}{" "}
                {tokenOut.symbol}
              </span>
            </div>
            <PriceImpact impact={priceImpact} />
            <div className="flex justify-between text-xs">
              <span className="text-plotswap-text-muted">Minimum received</span>
              <span className="font-mono">
                {formatTokenAmount(
                  amountOut - (amountOut * BigInt(Math.round(slippage * 100))) / 10000n,
                  tokenOut.decimals
                )}{" "}
                {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-plotswap-text-muted">LP Fee</span>
              <span className="font-mono">0.3%</span>
            </div>
          </div>
        )}

        {/* ERC-1404 Restriction Warning */}
        {hasRestriction && restrictionMessage && (
          <div className="mb-3 px-3 py-2.5 rounded-lg bg-plotswap-warning/10 border border-plotswap-warning/20">
            <div className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                <path d="M8 1L1 14h14L8 1z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6v3M8 11h.01" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-xs font-medium text-plotswap-warning">Transfer Restricted</p>
                <p className="text-xs text-plotswap-warning/80 mt-0.5">{restrictionMessage}</p>
                <p className="text-[10px] text-plotswap-text-subtle mt-1">
                  This ERC-1404 security token requires whitelist approval. Contact the token issuer for access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !hasRestriction && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={buttonState.action}
          disabled={buttonState.disabled}
          className="btn-primary w-full py-4 text-base"
        >
          {buttonState.label}
        </button>
      </div>

      {/* Connect Modal */}
      <ConnectModal isOpen={showConnect} onClose={() => setShowConnect(false)} />

      {/* Token Selector Modal */}
      <TokenSelector
        isOpen={selectorFor !== null}
        onClose={() => setSelectorFor(null)}
        onSelect={(token) => {
          if (selectorFor === "in") setTokenIn(token);
          else setTokenOut(token);
        }}
        excludeAddress={
          selectorFor === "in" ? tokenOut?.address : tokenIn?.address
        }
      />
    </div>
  );
}
