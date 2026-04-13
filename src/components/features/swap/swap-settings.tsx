"use client";

import { useState, useEffect } from "react";
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
  const [customStr, setCustomStr] = useState("");
  const isCustom = !SLIPPAGE_PRESETS.includes(slippage);

  useEffect(() => {
    if (isCustom) setCustomStr(String(slippage));
  }, [slippage, isCustom]);

  if (!isOpen) return null;

  const handleCustomChange = (v: string) => {
    // Allow decimals freely
    const cleaned = v.replace(/[^0-9.]/g, "");
    if (cleaned.split(".").length > 2) return;
    setCustomStr(cleaned);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      setSlippage(parsed);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 glass-card-elevated p-5 z-40">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-plotswap-text">Transaction Settings</span>
        <button onClick={onClose} className="text-plotswap-text-muted hover:text-plotswap-text">&times;</button>
      </div>

      <div className="mb-5">
        <label className="text-xs text-plotswap-text-muted mb-2 block">Slippage Tolerance</label>

        {/* Preset row */}
        <div className="flex gap-2 mb-2">
          {SLIPPAGE_PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => { setSlippage(v); setCustomStr(""); }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                !isCustom && slippage === v
                  ? "bg-plotswap-primary text-white"
                  : "bg-plotswap-primary/10 text-plotswap-text-muted hover:bg-plotswap-primary/15"
              )}
            >
              {v}%
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className={cn(
          "relative flex items-center rounded-lg border transition-colors",
          isCustom ? "border-plotswap-primary" : "border-plotswap-border"
        )}>
          <span className="pl-3 text-xs text-plotswap-text-muted">Custom</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.50"
            value={isCustom ? customStr : ""}
            onChange={(e) => handleCustomChange(e.target.value)}
            onFocus={() => { if (!isCustom) setCustomStr(""); }}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-right text-plotswap-text outline-none placeholder-plotswap-text-subtle"
          />
          <span className="pr-3 text-sm text-plotswap-text-muted">%</span>
        </div>

        {slippage > 5 && (
          <p className="text-xs text-plotswap-warning mt-2">
            High slippage — your transaction may be frontrun
          </p>
        )}
        {slippage < 0.1 && (
          <p className="text-xs text-plotswap-warning mt-2">
            Very low slippage — transaction may fail
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
            className="input-field w-24 py-2 px-3 text-sm text-right"
            min="1"
            max="120"
          />
          <span className="text-xs text-plotswap-text-muted">minutes</span>
        </div>
      </div>
    </div>
  );
}
