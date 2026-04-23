"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useTokenList } from "@/hooks/useTokenList";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAllPools } from "@/hooks/useAllPools";
import { TokenLogo } from "@/components/shared/token-logo";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { smartFormatAmount } from "@/lib/token-utils";
import type { TokenInfo } from "@/lib/token-list";

const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const WIRL_ADDRESS = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;

function formatWholeBalance(balance: bigint, decimals: number): string {
  const whole = smartFormatAmount(balance, decimals, 0).split(".")[0];
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const PRIORITY_SYMBOLS: Record<string, number> = { irl: 0, wirl: 1, tusdi: 2 };

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  excludeAddress?: `0x${string}`;
  context?: "swap" | "pool";
}

function TokenRow({
  token,
  onSelect,
  onBalance,
  disabled,
  disabledReason,
}: {
  token: TokenInfo;
  onSelect: () => void;
  onBalance: (addr: string, bal: bigint) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const balance = useTokenBalance(token.address);
  useEffect(() => {
    onBalance(token.address.toLowerCase(), balance);
  }, [balance, token.address, onBalance]);

  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className={
        "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors " +
        (disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-plotswap-primary/10")
      }
    >
      <TokenLogo
        address={token.address}
        symbol={token.symbol}
        logoURI={token.logoURI}
      />
      <div className="text-left flex-1 min-w-0">
        <div className="font-medium text-sm text-plotswap-text flex items-center gap-2">
          <span className="truncate">{token.symbol}</span>
          {disabled && disabledReason && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-plotswap-text-subtle/15 text-plotswap-text-muted border border-plotswap-border">
              {disabledReason}
            </span>
          )}
        </div>
        <div className="text-xs text-plotswap-text-muted truncate">{token.name}</div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div className="text-xs font-mono text-plotswap-text">
          {formatWholeBalance(balance, token.decimals)}
        </div>
        {token.isERC1404 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plotswap-warning/15 text-plotswap-warning border border-plotswap-warning/20">
            1404
          </span>
        )}
      </div>
    </button>
  );
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  excludeAddress,
  context = "pool",
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");
  const [customToken, setCustomToken] = useState<TokenInfo | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const { tokens: defaultTokens, isLoading } = useTokenList();
  const { tokens: walletTokens } = useWalletTokens();
  const { hasPoolFor, isSwapRoutable, isLoading: poolsLoading } = useAllPools();

  const tokens = useMemo<TokenInfo[]>(() => {
    const seen = new Set<string>();
    const out: TokenInfo[] = [];
    for (const t of [...defaultTokens, ...walletTokens]) {
      const key = t.address.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    }
    return out;
  }, [defaultTokens, walletTokens]);
  const { publicClient } = useWeb3();

  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const reportBalance = useCallback((addr: string, bal: bigint) => {
    setBalances((prev) => (prev[addr] === bal ? prev : { ...prev, [addr]: bal }));
  }, []);

  const lookupToken = useCallback(
    async (address: string) => {
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        setCustomToken(null);
        return;
      }
      setIsLoadingCustom(true);
      try {
        const [symbol, decimals] = await Promise.all([
          publicClient.readContract({ address: address as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" }),
          publicClient.readContract({ address: address as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" }),
        ]);
        let name: string;
        try {
          name = (await publicClient.readContract({ address: address as `0x${string}`, abi: [{ inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" }], functionName: "name" })) as string;
        } catch { name = symbol as string; }

        let isERC1404 = false;
        try {
          await publicClient.readContract({
            address: address as `0x${string}`,
            abi: [{ inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "detectTransferRestriction", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
            functionName: "detectTransferRestriction",
            args: ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", 0n],
          });
          isERC1404 = true;
        } catch { isERC1404 = false; }

        setCustomToken({ address: address as `0x${string}`, name, symbol: symbol as string, decimals: Number(decimals), logoURI: "", isERC1404 });
      } catch { setCustomToken(null); }
      setIsLoadingCustom(false);
    },
    [publicClient]
  );

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      if (t.address === excludeAddress) return false;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    });
  }, [tokens, excludeAddress, search]);

  // Per-token pool status (swap context only)
  const poolStatus = useMemo(() => {
    const m = new Map<string, { disabled: boolean; reason?: string }>();
    if (context !== "swap" || poolsLoading) return m;
    for (const t of filtered) {
      const key = t.address.toLowerCase();
      // WIRL and native IRL are always usable as a routing asset
      if (
        t.address.toLowerCase() === WIRL_ADDRESS.toLowerCase() ||
        t.address === NATIVE
      ) {
        m.set(key, { disabled: false });
        continue;
      }
      const routable = excludeAddress
        ? isSwapRoutable(t.address, excludeAddress)
        : hasPoolFor(t.address);
      m.set(key, routable ? { disabled: false } : { disabled: true, reason: "no pool" });
    }
    return m;
  }, [filtered, context, poolsLoading, excludeAddress, isSwapRoutable, hasPoolFor]);

  const sortedFiltered = useMemo(() => {
    const withPriority = (t: TokenInfo) => PRIORITY_SYMBOLS[t.symbol.toLowerCase()] ?? Infinity;
    return [...filtered].sort((a, b) => {
      // Pinned first 3
      const pa = withPriority(a);
      const pb = withPriority(b);
      if (pa !== pb) return pa - pb;
      // Swap-disabled tokens after enabled ones (within the non-pinned tail)
      if (context === "swap") {
        const da = poolStatus.get(a.address.toLowerCase())?.disabled ?? false;
        const db = poolStatus.get(b.address.toLowerCase())?.disabled ?? false;
        if (da !== db) return da ? 1 : -1;
      }
      // Balance desc, zero last
      const ba = balances[a.address.toLowerCase()] ?? 0n;
      const bb = balances[b.address.toLowerCase()] ?? 0n;
      const aZero = ba === 0n;
      const bZero = bb === 0n;
      if (aZero && !bZero) return 1;
      if (!aZero && bZero) return -1;
      if (bb > ba) return 1;
      if (bb < ba) return -1;
      return 0;
    });
  }, [filtered, balances, context, poolStatus]);

  if (!isOpen) return null;

  const showCustom = customToken && !tokens.some((t) => t.address.toLowerCase() === customToken.address.toLowerCase()) && customToken.address !== excludeAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-6 rounded-xl border shadow-2xl shadow-black/50" style={{ background: "var(--ps-card-elevated, #13132B)", borderColor: "var(--ps-border-strong)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-plotswap-text">Select a token</h3>
          <button onClick={onClose} className="text-plotswap-text-muted hover:text-plotswap-text text-xl">&times;</button>
        </div>

        <input
          type="text"
          placeholder="Search name or paste token address..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); lookupToken(e.target.value.trim()); }}
          className="input-field w-full px-4 py-3 mb-4 text-sm"
          autoFocus
        />

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {isLoadingCustom && (
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="w-4 h-4 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-plotswap-text-muted">Looking up token...</span>
            </div>
          )}

          {showCustom && (
            <TokenRow
              token={customToken}
              onSelect={() => { onSelect(customToken); onClose(); setSearch(""); setCustomToken(null); }}
              onBalance={reportBalance}
            />
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-plotswap-text-muted">Discovering tokens...</p>
            </div>
          ) : sortedFiltered.length > 0 ? (
            sortedFiltered.map((token) => {
              const status = poolStatus.get(token.address.toLowerCase());
              return (
                <TokenRow
                  key={token.address}
                  token={token}
                  onSelect={() => { onSelect(token); onClose(); setSearch(""); }}
                  onBalance={reportBalance}
                  disabled={status?.disabled}
                  disabledReason={status?.reason}
                />
              );
            })
          ) : !showCustom && !isLoadingCustom ? (
            <div className="text-center py-8">
              <p className="text-plotswap-text-muted text-sm mb-2">
                {tokens.length === 0 ? "No tokens discovered on-chain yet" : "No tokens match your search"}
              </p>
              <p className="text-xs text-plotswap-text-subtle">Paste a token contract address above to add any ERC-20 or ERC-1404 token</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
