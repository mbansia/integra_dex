"use client";

import { cn } from "@/lib/utils";

interface SwapSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  setSlippage: (v: number) => void;
  deadline: number;
  setDeadline: (v: number) => void;
}

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];

export function SwapSettings({
  isOpen,
  onClose,
  slippage,
  setSlippage,
  deadline,
  setDeadline,
}: SwapSettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-72 glass-card-elevated p-4 z-40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-plotswap-text">Transaction Settings</span>
        <button onClick={onClose} className="text-plotswap-text-muted hover:text-plotswap-text">
          &times;
        </button>
      </div>

      <div className="mb-4">
        <label className="text-xs text-plotswap-text-muted mb-2 block">Slippage Tolerance</label>
        <div className="flex gap-2">
          {SLIPPAGE_PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => setSlippage(v)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                slippage === v
                  ? "bg-plotswap-primary/20 text-plotswap-primary border border-plotswap-primary/30"
                  : "bg-plotswap-primary/5 text-plotswap-text-muted hover:bg-plotswap-primary/10"
              )}
            >
              {v}%
            </button>
          ))}
          <div className="relative flex-1">
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(Number(e.target.value))}
              className="input-field w-full py-1.5 px-2 text-xs text-right pr-6"
              step="0.1"
              min="0.01"
              max="50"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-plotswap-text-muted">%</span>
          </div>
        </div>
        {slippage > 5 && (
          <p className="text-xs text-plotswap-warning mt-1.5">
            High slippage — your transaction may be frontrun
          </p>
        )}
      </div>

      <div>
        <label className="text-xs text-plotswap-text-muted mb-2 block">Transaction Deadline</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={deadline}
            onChange={(e) => setDeadline(Number(e.target.value))}
            className="input-field w-20 py-1.5 px-2 text-xs text-right"
            min="1"
            max="120"
          />
          <span className="text-xs text-plotswap-text-muted">minutes</span>
        </div>
      </div>
    </div>
  );
}
