"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useTokenList } from "@/hooks/useTokenList";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { smartFormatAmount } from "@/lib/token-utils";
import { WIRL_ABI } from "@/lib/abis/WIRL";
import type { TokenInfo } from "@/lib/token-list";

const NATIVE = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const WIRL_ADDRESS = "0x0d9493f6dA7728ad1D43316674eFD679Ab104e34" as `0x${string}`;

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  excludeAddress?: `0x${string}`;
}

function TokenRow({ token, onSelect }: { token: TokenInfo; onSelect: () => void }) {
  const balance = useTokenBalance(token.address);

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-plotswap-primary/10 transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-xs font-bold text-plotswap-primary">
        {token.symbol.slice(0, 2)}
      </div>
      <div className="text-left flex-1">
        <div className="font-medium text-sm text-plotswap-text">{token.symbol}</div>
        <div className="text-xs text-plotswap-text-muted">{token.name}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-mono text-plotswap-text">
          {smartFormatAmount(balance, token.decimals, 4)}
        </div>
      </div>
      {token.isERC1404 && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plotswap-warning/15 text-plotswap-warning border border-plotswap-warning/20">
          1404
        </span>
      )}
    </button>
  );
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  excludeAddress,
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");
  const [customToken, setCustomToken] = useState<TokenInfo | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const { tokens: defaultTokens, isLoading } = useTokenList();
  const { tokens: walletTokens } = useWalletTokens();

  // Merge default + wallet tokens, no duplicates
  const seen = new Set<string>();
  const tokens: TokenInfo[] = [];
  for (const t of [...defaultTokens, ...walletTokens]) {
    const key = t.address.toLowerCase();
    if (!seen.has(key)) { seen.add(key); tokens.push(t); }
  }
  const { publicClient } = useWeb3();

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

  if (!isOpen) return null;

  const filtered = tokens.filter((t) => {
    if (t.address === excludeAddress) return false;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q) || t.address.toLowerCase().includes(q);
  });

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
            />
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-plotswap-text-muted">Discovering tokens...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((token) => (
              <TokenRow
                key={token.address}
                token={token}
                onSelect={() => { onSelect(token); onClose(); setSearch(""); }}
              />
            ))
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
