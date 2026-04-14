"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useWeb3 } from "@/providers/web3-provider";
import { useTokenList } from "@/hooks/useTokenList";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { ERC20_ABI } from "@/lib/abis/ERC20";
import { shortenAddress, formatTokenAmount } from "@/lib/utils";
import type { TokenInfo } from "@/lib/token-list";

function TokenRow({ token, index }: { token: TokenInfo; index: number }) {
  const balance = useTokenBalance(token.address);
  return (
    <tr className="border-b transition-colors" style={{ borderColor: "var(--ps-border)" }}>
      <td className="py-4 px-4 text-sm" style={{ color: "var(--ps-text-muted)" }}>{index + 1}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
            {token.symbol.slice(0, 2)}
          </div>
          <span className="font-medium text-sm" style={{ color: "var(--ps-text)" }}>{token.name}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-sm font-mono" style={{ color: "var(--ps-text)" }}>{token.symbol}</td>
      <td className="py-4 px-4">
        <span className="text-sm font-mono text-plotswap-text-muted">{shortenAddress(token.address)}</span>
      </td>
      <td className="py-4 px-4">
        {token.isERC1404 ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">ERC-1404</span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">ERC-20</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-sm font-mono" style={{ color: "var(--ps-text)" }}>
          {formatTokenAmount(balance, token.decimals, 4)}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-3">
          {token.address !== "0x0000000000000000000000000000000000000000" && (
            <button
              onClick={async () => {
                try {
                  const p = (window as any).ethereum;
                  if (!p) return;
                  await p.request({ method: "wallet_watchAsset", params: { type: "ERC20", options: { address: token.address, symbol: token.symbol.slice(0, 11), decimals: token.decimals } } });
                } catch {}
              }}
              className="text-xs font-medium text-plotswap-primary hover:text-plotswap-primary-hover transition-colors"
            >
              + Wallet
            </button>
          )}
          <Link href="/swap" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Trade</Link>
        </div>
      </td>
    </tr>
  );
}

export default function TokensPage() {
  const { tokens, isLoading } = useTokenList();
  const { tokens: walletTokens, isScanning, progress } = useWalletTokens();
  const { publicClient, isConnected } = useWeb3();
  const [showAdd, setShowAdd] = useState(false);
  const [addAddress, setAddAddress] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);

  const handleAdd = useCallback(async () => {
    if (!addAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setAddError("Enter a valid contract address");
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: addAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: addAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
      ]);

      let name: string;
      try {
        name = (await publicClient.readContract({
          address: addAddress as `0x${string}`,
          abi: [{ inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" }],
          functionName: "name",
        })) as string;
      } catch { name = symbol as string; }

      let isERC1404 = false;
      try {
        await publicClient.readContract({
          address: addAddress as `0x${string}`,
          abi: [{ inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "detectTransferRestriction", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
          functionName: "detectTransferRestriction",
          args: ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", 0n],
        });
        isERC1404 = true;
      } catch { isERC1404 = false; }

      setCustomTokens((prev) => [
        ...prev,
        { address: addAddress as `0x${string}`, name, symbol: symbol as string, decimals: Number(decimals), logoURI: "", isERC1404 },
      ]);
      setAddAddress("");
      setShowAdd(false);
    } catch {
      setAddError("Could not read token. Make sure it's a valid ERC-20 on Integra Testnet.");
    }
    setIsAdding(false);
  }, [addAddress, publicClient]);

  // Merge: default list + pool-discovered + wallet-scanned + manually added
  const seen = new Set<string>();
  const allTokens: TokenInfo[] = [];
  for (const t of [...tokens, ...walletTokens, ...customTokens]) {
    const key = t.address.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      allTokens.push(t);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pt-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ps-text)" }}>Tokens</h1>
          {isConnected && isScanning && (
            <p className="text-xs text-plotswap-text-muted mt-1">
              Scanning your wallet history... {progress}%
            </p>
          )}
          {isConnected && !isScanning && walletTokens.length > 0 && (
            <p className="text-xs text-plotswap-text-muted mt-1">
              Found {walletTokens.length} token{walletTokens.length !== 1 ? "s" : ""} from your wallet
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary px-4 py-2 text-sm"
        >
          {showAdd ? "Cancel" : "+ Add Token"}
        </button>
      </div>

      {/* Add token form */}
      {showAdd && (
        <div className="glass-card p-4 mb-6">
          <label className="text-sm font-medium block mb-2" style={{ color: "var(--ps-text)" }}>
            Token Contract Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x..."
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
              className="input-field flex-1 px-4 py-2.5 text-sm font-mono"
            />
            <button
              onClick={handleAdd}
              disabled={isAdding}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {isAdding ? "Looking up..." : "Add"}
            </button>
          </div>
          {addError && (
            <p className="text-xs mt-2" style={{ color: "#EF4444" }}>{addError}</p>
          )}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm" style={{ color: "var(--ps-text-muted)" }}>
              Discovering tokens on Integra Testnet...
            </p>
          </div>
        ) : allTokens.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: "var(--ps-text-muted)" }} className="mb-2">
              No tokens discovered yet
            </p>
            <p className="text-xs" style={{ color: "var(--ps-text-subtle)" }}>
              Click "+ Add Token" to add a token by contract address
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: "var(--ps-border)", color: "var(--ps-text-muted)" }}>
                <th className="text-left py-3 px-4 font-medium">#</th>
                <th className="text-left py-3 px-4 font-medium">Token</th>
                <th className="text-left py-3 px-4 font-medium">Symbol</th>
                <th className="text-left py-3 px-4 font-medium">Address</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-right py-3 px-4 font-medium">Balance</th>
                <th className="text-right py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {allTokens.map((token, i) => (
                <TokenRow key={token.address} token={token} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
