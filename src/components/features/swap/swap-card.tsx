"use client";

import { useState, useMemo } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useSwap } from "@/hooks/useSwap";
import { usePair } from "@/hooks/usePair";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useTransferRestriction } from "@/hooks/useTransferRestriction";
import { TokenSelector } from "./token-selector";
import { SwapSettings } from "./swap-settings";
import { PriceImpact } from "./price-impact";
import { ConnectModal } from "@/components/shared/connect-modal";
import {
  formatTokenAmount,
  calculatePriceImpact,
} from "@/lib/utils";
import { smartParseAmount, smartFormatAmount } from "@/lib/token-utils";
import { CONTRACTS } from "@/lib/contracts";
import type { TokenInfo } from "@/lib/token-list";

const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const WIRL_ADDR = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;
function resolveAddr(addr: `0x${string}` | undefined): `0x${string}` | undefined {
  if (!addr) return addr;
  return addr === NATIVE ? WIRL_ADDR : addr;
}

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

  const balanceIn = useTokenBalance(tokenIn?.address);
  const balanceOut = useTokenBalance(tokenOut?.address);

  const amountIn = useMemo(
    () => smartParseAmount(amountInStr, tokenIn?.decimals ?? 18, balanceIn),
    [amountInStr, tokenIn, balanceIn]
  );

  const { amountOut, isQuoting, isSwapping, error, success, swap } = useSwap(
    tokenIn?.address,
    tokenOut?.address,
    amountIn
  );
  const { pair } = usePair(resolveAddr(tokenIn?.address), resolveAddr(tokenOut?.address));
  const { allowance, approve, isPending: isApproving } = useTokenApproval(
    tokenIn?.address
  );

  const needsApproval = tokenIn && amountIn > 0n && allowance < amountIn;
  const insufficientBalance = tokenIn && amountIn > 0n && balanceIn < amountIn;

  const { address } = useWeb3();
  const pairAddress = CONTRACTS.Factory !== "0x" ? CONTRACTS.Router : undefined;

  const sendRestriction = useTransferRestriction(
    tokenIn?.address, address ?? undefined, pairAddress, amountIn, tokenIn?.isERC1404 ?? false
  );
  const receiveRestriction = useTransferRestriction(
    tokenOut?.address, pairAddress, address ?? undefined, amountOut, tokenOut?.isERC1404 ?? false
  );

  const hasRestriction = sendRestriction.restricted || receiveRestriction.restricted;
  const restrictionMessage = sendRestriction.restricted
    ? `${tokenIn?.symbol}: ${sendRestriction.message}`
    : receiveRestriction.restricted
      ? `${tokenOut?.symbol}: ${receiveRestriction.message}`
      : null;
  const isCheckingRestriction = sendRestriction.isChecking || receiveRestriction.isChecking;

  const priceImpact = useMemo(() => {
    if (!amountIn || !amountOut || !pair) return 0;
    // Determine which reserve is input vs output
    const resolvedIn = resolveAddr(tokenIn?.address);
    const isToken0In = resolvedIn?.toLowerCase() === pair.token0.toLowerCase();
    const reserveIn = isToken0In ? pair.reserve0 : pair.reserve1;
    const reserveOut = isToken0In ? pair.reserve1 : pair.reserve0;
    return calculatePriceImpact(amountIn, amountOut, reserveIn, reserveOut);
  }, [amountIn, amountOut, pair, tokenIn]);

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountInStr("");
  };

  const buttonState = useMemo(() => {
    if (!isConnected) return { label: "Connect Wallet", action: () => setShowConnect(true), disabled: false };
    if (!tokenIn || !tokenOut) return { label: "Select tokens", action: undefined, disabled: true };
    const bothSelected = tokenIn && tokenOut;
    const noPair = bothSelected && !pair && !isQuoting;
    if (noPair) return { label: "No pool exists for this pair", action: undefined, disabled: true };
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
          <h2 className="text-lg font-semibold text-plotswap-text">Swap</h2>
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
                Balance: {smartFormatAmount(balanceIn, tokenIn.decimals, 4)}
                <button
                  onClick={() => setAmountInStr(smartFormatAmount(balanceIn, tokenIn.decimals, tokenIn.decimals))}
                  className="ml-1 text-plotswap-primary hover:text-plotswap-primary-hover"
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
              className="flex-1 bg-transparent text-2xl font-mono outline-none text-plotswap-text placeholder-plotswap-text-subtle"
            />
            <button
              onClick={() => setSelectorFor("in")}
              className="flex items-center gap-2 glass-card px-3 py-2 hover:border-plotswap-border-strong transition-colors whitespace-nowrap"
            >
              {tokenIn ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-[10px] font-bold text-plotswap-primary">
                    {tokenIn.symbol.slice(0, 2)}
                  </div>
                  <span className="font-medium text-sm text-plotswap-text">{tokenIn.symbol}</span>
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
            className="w-10 h-10 rounded-xl bg-plotswap-bg border border-plotswap-border flex items-center justify-center hover:border-plotswap-primary/30 hover:bg-plotswap-primary/5 transition-all text-plotswap-text-muted"
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
                Balance: {smartFormatAmount(balanceOut, tokenOut.decimals, 4)}
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
                  <span className="font-medium text-sm text-plotswap-text">{tokenOut.symbol}</span>
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
              <span className="font-mono text-plotswap-text">
                1 {tokenIn.symbol} ={" "}
                {amountIn > 0n
                  ? (
                      (Number(amountOut) / Math.pow(10, tokenOut.decimals)) /
                      (Number(amountIn) / Math.pow(10, tokenIn.decimals))
                    ).toFixed(6)
                  : "—"}{" "}
                {tokenOut.symbol}
              </span>
            </div>
            <PriceImpact impact={priceImpact} />
            <div className="flex justify-between text-xs">
              <span className="text-plotswap-text-muted">Slippage Tolerance</span>
              <span className="font-mono text-plotswap-text">{slippage}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-plotswap-text-muted">Minimum received</span>
              <span className="font-mono text-plotswap-text">
                {formatTokenAmount(
                  amountOut - (amountOut * BigInt(Math.round(slippage * 100))) / 10000n,
                  tokenOut.decimals
                )}{" "}
                {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-plotswap-text-muted">LP Fee (0.3%)</span>
              <span className="font-mono text-plotswap-text">
                {formatTokenAmount(
                  (amountIn * 3n) / 1000n,
                  tokenIn.decimals,
                  6
                )}{" "}
                {tokenIn.symbol}
              </span>
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
        {error && !hasRestriction && !success && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-plotswap-success/10 border border-plotswap-success/20 text-plotswap-success text-xs">
            Swap completed successfully!
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
        excludeAddress={selectorFor === "in" ? tokenOut?.address : tokenIn?.address}
      />
    </div>
  );
}

