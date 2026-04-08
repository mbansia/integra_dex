"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/web3-provider";
import { useTokenList } from "@/hooks/useTokenList";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import type { TokenInfo } from "@/lib/token-list";

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  excludeAddress?: `0x${string}`;
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
  const { tokens, isLoading } = useTokenList();
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
          publicClient.readContract({
            address: address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "symbol",
          }),
          publicClient.readContract({
            address: address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "decimals",
          }),
        ]);

        let name: string;
        try {
          name = (await publicClient.readContract({
            address: address as `0x${string}`,
            abi: [
              {
                inputs: [],
                name: "name",
                outputs: [{ type: "string" }],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "name",
          })) as string;
        } catch {
          name = symbol as string;
        }

        let isERC1404 = false;
        try {
          await publicClient.readContract({
            address: address as `0x${string}`,
            abi: [
              {
                inputs: [
                  { name: "from", type: "address" },
                  { name: "to", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                name: "detectTransferRestriction",
                outputs: [{ type: "uint8" }],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "detectTransferRestriction",
            args: [
              "0x0000000000000000000000000000000000000000",
              "0x0000000000000000000000000000000000000000",
              0n,
            ],
          });
          isERC1404 = true;
        } catch {
          isERC1404 = false;
        }

        setCustomToken({
          address: address as `0x${string}`,
          name,
          symbol: symbol as string,
          decimals: Number(decimals),
          logoURI: "",
          isERC1404,
        });
      } catch {
        setCustomToken(null);
      }
      setIsLoadingCustom(false);
    },
    [publicClient]
  );

  if (!isOpen) return null;

  const filtered = tokens.filter((t) => {
    if (t.address === excludeAddress) return false;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    );
  });

  // Show custom token if search is an address and not already in the list
  const showCustom =
    customToken &&
    !tokens.some(
      (t) => t.address.toLowerCase() === customToken.address.toLowerCase()
    ) &&
    customToken.address !== excludeAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass-card-elevated w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select a token</h3>
          <button
            onClick={onClose}
            className="text-plotswap-text-muted hover:text-plotswap-text text-xl"
          >
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="Search name or paste token address..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            lookupToken(e.target.value.trim());
          }}
          className="input-field w-full px-4 py-3 mb-4 text-sm"
          autoFocus
        />

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {/* Custom token from address lookup */}
          {isLoadingCustom && (
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="w-4 h-4 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-plotswap-text-muted">
                Looking up token...
              </span>
            </div>
          )}

          {showCustom && (
            <button
              onClick={() => {
                onSelect(customToken);
                onClose();
                setSearch("");
                setCustomToken(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-plotswap-primary/5 border border-plotswap-primary/20 hover:bg-plotswap-primary/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-plotswap-accent/20 flex items-center justify-center text-xs font-bold text-plotswap-accent">
                {customToken.symbol.slice(0, 2)}
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-sm">
                  {customToken.symbol}
                  <span className="ml-2 text-[10px] text-plotswap-text-muted font-normal">
                    (from address)
                  </span>
                </div>
                <div className="text-xs text-plotswap-text-muted">
                  {customToken.name}
                </div>
              </div>
              {customToken.isERC1404 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plotswap-warning/15 text-plotswap-warning border border-plotswap-warning/20">
                  1404
                </span>
              )}
            </button>
          )}

          {/* Discovered tokens */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-plotswap-text-muted">
                Discovering tokens...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onSelect(token);
                  onClose();
                  setSearch("");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-plotswap-primary/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-xs font-bold text-plotswap-primary-light">
                  {token.symbol.slice(0, 2)}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{token.symbol}</div>
                  <div className="text-xs text-plotswap-text-muted">
                    {token.name}
                  </div>
                </div>
                {token.isERC1404 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plotswap-warning/15 text-plotswap-warning border border-plotswap-warning/20">
                    1404
                  </span>
                )}
              </button>
            ))
          ) : !showCustom && !isLoadingCustom ? (
            <div className="text-center py-8">
              <p className="text-plotswap-text-muted text-sm mb-2">
                {tokens.length === 0
                  ? "No tokens discovered on-chain yet"
                  : "No tokens match your search"}
              </p>
              <p className="text-xs text-plotswap-text-subtle">
                Paste a token contract address above to add any ERC-20 or
                ERC-1404 token
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
