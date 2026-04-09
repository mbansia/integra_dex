"use client";

import { useWeb3, type ConnectMethod } from "@/providers/web3-provider";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_OPTIONS: {
  method: ConnectMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
}[] = [
  {
    method: "metamask",
    label: "Browser Wallet",
    description: "MetaMask, Rabby, Coinbase, or any injected wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#F6851B" fillOpacity="0.15" />
        <path
          d="M20.5 8L15 12l1 -3.5L20.5 8z"
          fill="#E2761B"
          stroke="#E2761B"
          strokeWidth="0.25"
        />
        <path
          d="M7.5 8l5.4 4.05L12 8.5 7.5 8zM19 18.5l-1.5 3.5 3.2-.9.9-3.1-2.6.5zM6.4 18l.9 3.1 3.2.9L9 18.5 6.4 18z"
          fill="#E4761B"
          stroke="#E4761B"
          strokeWidth="0.25"
        />
        <path
          d="M10.4 14.2l-.9 1.4 3.2.15-.1-3.5-2.2 1.95zM17.6 14.2l-2.25-2 -.05 3.55 3.2-.15-.9-1.4z"
          fill="#E4761B"
          stroke="#E4761B"
          strokeWidth="0.25"
        />
        <path
          d="M10.5 22l2-1-.2-1.3-1.8.3v2zM15.5 21l2 1v-2l-1.8-.3-.2 1.3z"
          fill="#D7C1B3"
          stroke="#D7C1B3"
          strokeWidth="0.25"
        />
      </svg>
    ),
  },
  {
    method: "web3auth",
    label: "Social Login",
    description: "Google, X, Email, Discord — no wallet needed",
    tag: "Coming soon",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#6366F1" fillOpacity="0.15" />
        <circle cx="14" cy="11" r="3" stroke="#818CF8" strokeWidth="1.5" />
        <path
          d="M8 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
          stroke="#818CF8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { connect, isConnecting, error } = useWeb3();

  if (!isOpen) return null;

  const handleConnect = async (method: ConnectMethod) => {
    await connect(method);
    // Close modal on success (error stays visible)
    // We check after connect because state updates async
    setTimeout(() => {
      const ctx = document.querySelector("[data-connected]");
      if (ctx) onClose();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm p-6 rounded-xl border border-plotswap-border-strong bg-[#13132B] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Connect Wallet</h3>
          <button
            onClick={onClose}
            className="text-plotswap-text-muted hover:text-plotswap-text text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-2">
          {WALLET_OPTIONS.map((option) => {
            const isDisabled = isConnecting || !!option.tag;
            return (
              <button
                key={option.method}
                onClick={() => !isDisabled && handleConnect(option.method)}
                disabled={isDisabled}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-plotswap-primary/5 border border-plotswap-border hover:border-plotswap-border-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex-shrink-0">{option.icon}</div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm group-hover:text-plotswap-primary-light transition-colors">
                      {option.label}
                    </span>
                    {option.tag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-plotswap-text-subtle/20 text-plotswap-text-subtle">
                        {option.tag}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-plotswap-text-muted">
                    {option.description}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-plotswap-text-subtle group-hover:text-plotswap-text-muted transition-colors"
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
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-plotswap-text-muted">
            <div className="w-4 h-4 border-2 border-plotswap-primary border-t-transparent rounded-full animate-spin" />
            Connecting...
          </div>
        )}

        {error && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-plotswap-danger/10 border border-plotswap-danger/20 text-plotswap-danger text-xs">
            {error}
          </div>
        )}

        <p className="mt-4 text-[11px] text-plotswap-text-subtle text-center">
          By connecting, you agree to the PlotSwap Terms of Service
        </p>
      </div>
    </div>
  );
}
