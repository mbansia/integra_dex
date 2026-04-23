"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWeb3 } from "@/providers/web3-provider";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_OPTIONS: {
  label: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
}[] = [
  {
    label: "Browser Wallet",
    description: "MetaMask, Rabby, Coinbase, or any injected wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#F6851B" fillOpacity="0.15" />
        <path d="M20.5 8L15 12l1-3.5L20.5 8z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.25" />
        <path d="M7.5 8l5.4 4.05L12 8.5 7.5 8zM19 18.5l-1.5 3.5 3.2-.9.9-3.1-2.6.5zM6.4 18l.9 3.1 3.2.9L9 18.5 6.4 18z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.25" />
      </svg>
    ),
  },
];

function ConnectModalContent({ onClose }: { onClose: () => void }) {
  const { connect, isConnected, isConnecting, error } = useWeb3();

  // Auto-close on successful connection
  useEffect(() => {
    if (isConnected) onClose();
  }, [isConnected, onClose]);

  const handleConnect = async () => {
    await connect();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.75)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-xl border"
        style={{
          background: "var(--ps-card-elevated, #13132B)",
          borderColor: "var(--ps-border-strong)",
          padding: "24px",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold" style={{ color: "var(--ps-text)" }}>Connect Wallet</h3>
          <button
            onClick={onClose}
            className="text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: "var(--ps-text-muted)" }}
          >
            &times;
          </button>
        </div>

        <div className="space-y-2">
          {WALLET_OPTIONS.map((option) => {
            const isDisabled = isConnecting || !!option.tag;
            return (
              <button
                key={option.label}
                onClick={() => !isDisabled && handleConnect()}
                disabled={isDisabled}
                className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderColor: "rgba(99, 102, 241, 0.12)",
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.12)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
              >
                <div className="flex-shrink-0">{option.icon}</div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: "var(--ps-text)" }}>
                      {option.label}
                    </span>
                    {option.tag && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(107, 114, 128, 0.2)",
                          color: "var(--ps-text-subtle)",
                        }}
                      >
                        {option.tag}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--ps-text-muted)" }}>
                    {option.description}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ color: "var(--ps-text-subtle)" }}
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>

        {isConnecting && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--ps-text-muted)" }}>
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
            />
            Connecting...
          </div>
        )}

        {error && (
          <div
            className="mt-4 px-3 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#EF4444",
            }}
          >
            {error}
          </div>
        )}

        <p className="mt-4 text-[11px] text-center" style={{ color: "var(--ps-text-subtle)" }}>
          By connecting, you agree to the PlotSwap Terms of Service
        </p>
      </div>
    </div>
  );
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <ConnectModalContent onClose={onClose} />,
    document.body
  );
}
