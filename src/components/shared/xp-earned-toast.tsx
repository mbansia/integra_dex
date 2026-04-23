"use client";

import { useEffect, useState } from "react";

const DASHBOARD_URL = "http://dashboard.integralayer.com/";

interface XpEarnedToastProps {
  points: number;
  onDismiss: () => void;
}

export function XpEarnedToast({ points, onDismiss }: XpEarnedToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const autoDismiss = setTimeout(() => setLeaving(true), 6000);
    return () => clearTimeout(autoDismiss);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDismiss, 400);
    return () => clearTimeout(t);
  }, [leaving, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] ${leaving ? "xp-toast-exit" : "xp-toast-enter"}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="xp-sparks pointer-events-none absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="xp-spark" />
          ))}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-plotswap-border-strong bg-plotswap-card-elevated shadow-[0_10px_40px_-10px_rgba(59,130,246,0.4)] min-w-[300px]">
          <div className="xp-shine pointer-events-none absolute inset-0" />
          <div className="relative flex items-center gap-3 p-4">
            <div className="xp-coin flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-sm font-bold text-white shadow-[0_0_16px_rgba(251,191,36,0.55)]">
              XP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-plotswap-text">
                +{points.toLocaleString()} XP earned!
              </p>
              <a
                href={DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-plotswap-primary hover:text-plotswap-primary-hover"
              >
                Check on dashboard
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <button
              onClick={() => setLeaving(true)}
              className="text-plotswap-text-muted transition-colors hover:text-plotswap-text"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
