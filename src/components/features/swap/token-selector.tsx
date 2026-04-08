"use client";

import { useState } from "react";
import { DEFAULT_TOKEN_LIST, type TokenInfo } from "@/lib/token-list";

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

  if (!isOpen) return null;

  const filtered = DEFAULT_TOKEN_LIST.filter((t) => {
    if (t.address === excludeAddress) return false;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    );
  });

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
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full px-4 py-3 mb-4 text-sm"
          autoFocus
        />

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filtered.map((token) => (
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
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-plotswap-text-muted py-8 text-sm">
              No tokens found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
