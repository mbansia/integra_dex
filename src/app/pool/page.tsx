"use client";

import { useState } from "react";
import { AddLiquidityForm } from "@/components/features/pool/add-liquidity-form";
import { UserPositions } from "@/components/features/pool/user-positions";
import { ExistingPools } from "@/components/features/pool/existing-pools";
import { cn } from "@/lib/utils";

export default function PoolPage() {
  const [tab, setTab] = useState<"add" | "positions">("add");

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] pt-12 px-4 pb-20">
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
          <UserPositions />
        )}
      </div>

      {/* Existing pools below */}
      <ExistingPools />
    </div>
  );
}
