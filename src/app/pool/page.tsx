"use client";

import { useState } from "react";
import { AddLiquidityForm } from "@/components/features/pool/add-liquidity-form";
import { cn } from "@/lib/utils";

export default function PoolPage() {
  const [tab, setTab] = useState<"add" | "positions">("add");

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] pt-12 px-4">
      <div className="w-full max-w-[460px]">
        <div className="flex gap-1 mb-6 glass-card p-1">
          <button
            onClick={() => setTab("add")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
              tab === "add"
                ? "bg-plotswap-primary/15 text-plotswap-primary"
                : "text-plotswap-text-muted hover:text-plotswap-text"
            )}
          >
            Add Liquidity
          </button>
          <button
            onClick={() => setTab("positions")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
              tab === "positions"
                ? "bg-plotswap-primary/15 text-plotswap-primary"
                : "text-plotswap-text-muted hover:text-plotswap-text"
            )}
          >
            Your Positions
          </button>
        </div>

        {tab === "add" ? (
          <AddLiquidityForm />
        ) : (
          <div className="glass-card p-8 text-center">
            <div className="text-plotswap-text-muted text-sm mb-2">
              Connect your wallet to view positions
            </div>
            <p className="text-xs text-plotswap-text-subtle">
              Your active liquidity positions will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
