"use client";

import { useState, useMemo } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { TokenSelector } from "@/components/features/swap/token-selector";
import { ConnectModal } from "@/components/shared/connect-modal";
import { WIRL_ABI } from "@/lib/abis/WIRL";
import { formatTokenAmount, parseTokenAmount } from "@/lib/utils";
import type { TokenInfo } from "@/lib/token-list";

const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const WIRL_ADDR = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;
function resolveAddr(addr: `0x${string}` | undefined): `0x${string}` | undefined {
  if (!addr) return addr;
  return addr === NATIVE ? WIRL_ADDR : addr;
}

export function AddLiquidityForm() {
  const { isConnected, address, walletClient, publicClient } = useWeb3();
  const [showConnect, setShowConnect] = useState(false);
  const { addLiquidity, isPending, error, success } = useLiquidity();

  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountAStr, setAmountAStr] = useState("");
  const [amountBStr, setAmountBStr] = useState("");
  const [selectorFor, setSelectorFor] = useState<"a" | "b" | null>(null);
  const [isWrapping, setIsWrapping] = useState(false);
  const [wrapError, setWrapError] = useState<string | null>(null);

  const amountA = useMemo(
    () => parseTokenAmount(amountAStr, tokenA?.decimals ?? 18),
    [amountAStr, tokenA]
  );
  const amountB = useMemo(
    () => parseTokenAmount(amountBStr, tokenB?.decimals ?? 18),
    [amountBStr, tokenB]
  );

  const isNativeA = tokenA?.address === NATIVE;
  const isNativeB = tokenB?.address === NATIVE;

  // Show WIRL balance when IRL is selected (that's what the contract uses)
  const resolvedAddrA = resolveAddr(tokenA?.address);
  const resolvedAddrB = resolveAddr(tokenB?.address);

  // For IRL: show native balance. For display we also fetch WIRL balance.
  const nativeBalanceA = useTokenBalance(tokenA?.address);
  const nativeBalanceB = useTokenBalance(tokenB?.address);
  const wirlBalanceA = useTokenBalance(isNativeA ? WIRL_ADDR : undefined);
  const wirlBalanceB = useTokenBalance(isNativeB ? WIRL_ADDR : undefined);

  // Display balance: for IRL show native + WIRL available
  const balanceA = isNativeA ? nativeBalanceA : nativeBalanceA;
  const balanceB = isNativeB ? nativeBalanceB : nativeBalanceB;

  const approvalA = useTokenApproval(resolvedAddrA);
  const approvalB = useTokenApproval(resolvedAddrB);

  // For native IRL: need to check WIRL balance, not just approval
  const needsWrapA = isNativeA && amountA > 0n && wirlBalanceA < amountA;
  const needsWrapB = isNativeB && amountB > 0n && wirlBalanceB < amountB;
  const needsApprovalA = tokenA && amountA > 0n && !isNativeA && approvalA.allowance < amountA;
  const needsApprovalB = tokenB && amountB > 0n && !isNativeB && approvalB.allowance < amountB;

  const handleWrap = async (amount: bigint) => {
    if (!walletClient || !address) return;
    setIsWrapping(true);
    setWrapError(null);
    try {
      console.log("[PlotSwap] Auto-wrapping IRL to WIRL:", amount.toString());
      const hash = await walletClient.writeContract({
        address: WIRL_ADDR,
        abi: WIRL_ABI,
        functionName: "deposit",
        value: amount,
        account: address,
        chain: walletClient.chain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") {
        setWrapError("Wrap failed on-chain");
      } else {
        console.log("[PlotSwap] Wrapped successfully");
      }
    } catch (err: any) {
      setWrapError(err?.shortMessage || "Failed to wrap IRL");
    }
    setIsWrapping(false);
  };

  const handleSubmit = async () => {
    if (!tokenA || !tokenB || amountA === 0n || amountB === 0n) return;
    await addLiquidity(tokenA.address, tokenB.address, amountA, amountB);
  };

  const renderTokenInput = (
    label: string,
    token: TokenInfo | null,
    amount: string,
    setAmount: (v: string) => void,
    balance: bigint,
    side: "a" | "b",
    isNative: boolean,
    wirlBalance: bigint
  ) => (
    <div className="glass-card-elevated p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-plotswap-text-muted">{label}</span>
        {token && (
          <span className="text-xs text-plotswap-text-muted">
            Balance: {formatTokenAmount(balance, token.decimals, 4)}
            {isNative && (
              <span className="ml-1 text-plotswap-text-subtle">
                (WIRL: {formatTokenAmount(wirlBalance, 18, 4)})
              </span>
            )}
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
          className="flex-1 bg-transparent text-xl font-mono outline-none text-plotswap-text placeholder-plotswap-text-subtle"
        />
        <button
          onClick={() => setSelectorFor(side)}
          className="flex items-center gap-2 glass-card px-3 py-2 hover:border-plotswap-border-strong transition-colors whitespace-nowrap"
        >
          {token ? (
            <>
              <div className="w-6 h-6 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-[10px] font-bold text-plotswap-primary">
                {token.symbol.slice(0, 2)}
              </div>
              <span className="font-medium text-sm text-plotswap-text">{token.symbol}</span>
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
        <h2 className="text-lg font-semibold text-plotswap-text mb-3">Add Liquidity</h2>

        {renderTokenInput("Token A", tokenA, amountAStr, setAmountAStr, balanceA, "a", isNativeA, wirlBalanceA)}

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-lg bg-plotswap-bg border border-plotswap-border flex items-center justify-center text-plotswap-text-muted">
            +
          </div>
        </div>

        {renderTokenInput("Token B", tokenB, amountBStr, setAmountBStr, balanceB, "b", isNativeB, wirlBalanceB)}

        {(error || approvalA.error || approvalB.error || wrapError) && (
          <div className="px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
            {wrapError || error || approvalA.error || approvalB.error}
          </div>
        )}

        {success && (
          <div className="px-3 py-2 rounded-lg bg-plotswap-success/10 border border-plotswap-success/20 text-plotswap-success text-xs">
            Liquidity added successfully!
          </div>
        )}

        <div className="pt-2 space-y-2">
          {/* Step 1: Wrap IRL if needed */}
          {needsWrapA && (
            <button
              onClick={() => handleWrap(amountA - wirlBalanceA)}
              disabled={isWrapping}
              className="btn-primary w-full py-3 text-sm"
            >
              {isWrapping ? "Wrapping IRL..." : `Wrap ${formatTokenAmount(amountA - wirlBalanceA, 18, 4)} IRL → WIRL`}
            </button>
          )}
          {needsWrapB && (
            <button
              onClick={() => handleWrap(amountB - wirlBalanceB)}
              disabled={isWrapping}
              className="btn-primary w-full py-3 text-sm"
            >
              {isWrapping ? "Wrapping IRL..." : `Wrap ${formatTokenAmount(amountB - wirlBalanceB, 18, 4)} IRL → WIRL`}
            </button>
          )}

          {/* Step 2: Approve tokens */}
          {!needsWrapA && !needsWrapB && needsApprovalA && (
            <button
              onClick={approvalA.approve}
              disabled={approvalA.isPending}
              className="btn-primary w-full py-3 text-sm"
            >
              {approvalA.isPending ? "Approving..." : `Approve ${tokenA!.symbol}`}
            </button>
          )}
          {!needsWrapA && !needsWrapB && needsApprovalB && (
            <button
              onClick={approvalB.approve}
              disabled={approvalB.isPending}
              className="btn-primary w-full py-3 text-sm"
            >
              {approvalB.isPending ? "Approving..." : `Approve ${tokenB!.symbol}`}
            </button>
          )}

          {/* Step 3: Supply */}
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
                isWrapping ||
                !!needsWrapA ||
                !!needsWrapB ||
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
        excludeAddress={selectorFor === "a" ? tokenB?.address : tokenA?.address}
      />
    </div>
  );
}
