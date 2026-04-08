"use client";

import { useState, useEffect } from "react";
import { getExplorerUrl, cn } from "@/lib/utils";

interface TxToastProps {
  hash?: string;
  status: "pending" | "success" | "error";
  message: string;
  onDismiss: () => void;
}

export function TxStatusToast({
  hash,
  status,
  message,
  onDismiss,
}: TxToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 glass-card-elevated p-4 min-w-[300px] animate-in slide-in-from-bottom-2">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            status === "pending" && "bg-plotswap-primary/15",
            status === "success" && "bg-plotswap-success/15",
            status === "error" && "bg-plotswap-danger/15"
          )}
        >
          {status === "pending" && (
            <div className="w-4 h-4 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin" />
          )}
          {status === "success" && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 8l3 3 5-5"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {status === "error" && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          {hash && (
            <a
              href={getExplorerUrl(hash, "tx")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-plotswap-primary-light hover:text-plotswap-primary mt-1 inline-block"
            >
              View on Explorer
            </a>
          )}
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="text-plotswap-text-muted hover:text-plotswap-text"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
