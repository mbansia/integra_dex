"use client";

import { cn } from "@/lib/utils";

interface PriceImpactProps {
  impact: number;
}

export function PriceImpact({ impact }: PriceImpactProps) {
  const color =
    impact < 1
      ? "text-plotswap-success"
      : impact < 5
        ? "text-plotswap-warning"
        : "text-plotswap-danger";

  return (
    <div className="flex justify-between text-xs">
      <span className="text-plotswap-text-muted">Price Impact</span>
      <span className={cn("font-mono", color)}>
        {impact < 0.01 ? "<0.01" : impact.toFixed(2)}%
      </span>
    </div>
  );
}
