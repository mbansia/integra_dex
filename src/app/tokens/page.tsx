"use client";

import Link from "next/link";
import { DEFAULT_TOKEN_LIST } from "@/lib/token-list";
import { shortenAddress } from "@/lib/utils";

export default function TokensPage() {
  return (
    <div className="max-w-4xl mx-auto pt-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Tokens</h1>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-plotswap-border text-xs text-plotswap-text-muted">
              <th className="text-left py-3 px-4 font-medium">#</th>
              <th className="text-left py-3 px-4 font-medium">Token</th>
              <th className="text-left py-3 px-4 font-medium">Symbol</th>
              <th className="text-left py-3 px-4 font-medium">Address</th>
              <th className="text-left py-3 px-4 font-medium">Type</th>
              <th className="text-right py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_TOKEN_LIST.map((token, i) => (
              <tr
                key={token.address}
                className="border-b border-plotswap-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4 px-4 text-sm text-plotswap-text-muted">
                  {i + 1}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-plotswap-primary/20 flex items-center justify-center text-xs font-bold text-plotswap-primary-light">
                      {token.symbol.slice(0, 2)}
                    </div>
                    <span className="font-medium text-sm">{token.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm font-mono">
                  {token.symbol}
                </td>
                <td className="py-4 px-4">
                  <a
                    href={`https://explorer.integralayer.com/address/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-plotswap-primary-light hover:text-plotswap-primary transition-colors"
                  >
                    {shortenAddress(token.address)}
                  </a>
                </td>
                <td className="py-4 px-4">
                  {token.isERC1404 ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plotswap-warning/15 text-plotswap-warning border border-plotswap-warning/20">
                      ERC-1404
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-plotswap-primary/10 text-plotswap-primary-light border border-plotswap-primary/20">
                      ERC-20
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <Link
                    href="/swap"
                    className="text-xs font-medium text-plotswap-accent hover:text-plotswap-accent-light transition-colors"
                  >
                    Trade
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
