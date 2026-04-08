"use client";

import { useWeb3 } from "@/providers/web3-provider";
import { shortenAddress } from "@/lib/utils";
import { useState } from "react";

export function ConnectButton() {
  const { address, isConnected, isLoading, error, connect, disconnect } =
    useWeb3();
  const [showMenu, setShowMenu] = useState(false);

  if (isLoading) {
    return (
      <button className="btn-primary px-5 py-2.5 text-sm opacity-50" disabled>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-xs text-plotswap-danger max-w-[200px] truncate" title={error}>
            {error}
          </span>
        )}
        <button onClick={connect} className="btn-primary px-5 py-2.5 text-sm">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="glass-card px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:border-plotswap-border-strong transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-plotswap-success" />
        <span className="font-mono">{shortenAddress(address!)}</span>
      </button>
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 glass-card-elevated p-2 z-50">
            <button
              onClick={() => {
                navigator.clipboard.writeText(address!);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-plotswap-primary/10 transition-colors"
            >
              Copy Address
            </button>
            <a
              href={`https://explorer.integralayer.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm rounded-md hover:bg-plotswap-primary/10 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              View on Explorer
            </a>
            <button
              onClick={() => {
                disconnect();
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-plotswap-danger/10 text-plotswap-danger transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
