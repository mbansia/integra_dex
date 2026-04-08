import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight">
          <span className="gradient-text">Trade tokens</span>
          <br />
          on Integra
        </h1>
        <p className="text-lg text-plotswap-text-muted mb-8 max-w-md mx-auto">
          Swap ERC-20 and ERC-1404 security tokens with automated market making.
          Low fees. Instant settlement.
        </p>
        <div className="flex items-center gap-4 justify-center">
          <Link href="/swap" className="btn-primary px-8 py-3.5 text-base">
            Launch App
          </Link>
          <Link
            href="/pool"
            className="px-8 py-3.5 text-base font-semibold rounded-xl border border-plotswap-border hover:border-plotswap-border-strong hover:bg-white/5 transition-all"
          >
            Add Liquidity
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full">
        {[
          { label: "Protocol", value: "PlotSwap" },
          { label: "Network", value: "Integra Testnet" },
          { label: "Swap Fee", value: "0.3%" },
          { label: "Token Standards", value: "ERC-20 & 1404" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-4 text-center"
          >
            <div className="text-lg font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-plotswap-text-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mt-12">
        <div className="glass-card p-5">
          <div className="w-10 h-10 rounded-xl bg-plotswap-primary/15 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 10h4l2-6 3 12 2-6h3"
                stroke="#818CF8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-sm mb-1">AMM Powered</h3>
          <p className="text-xs text-plotswap-text-muted">
            Constant product market maker ensures instant swaps with deep liquidity.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="w-10 h-10 rounded-xl bg-plotswap-accent/15 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="3" stroke="#06B6D4" strokeWidth="1.5" />
              <path d="M7 10l2 2 4-4" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold text-sm mb-1">Security Tokens</h3>
          <p className="text-xs text-plotswap-text-muted">
            First-class ERC-1404 support with on-chain compliance checks.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="w-10 h-10 rounded-xl bg-plotswap-warning/15 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#F59E0B" strokeWidth="1.5" />
              <path d="M10 6v4l3 2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="font-semibold text-sm mb-1">Earn XP</h3>
          <p className="text-xs text-plotswap-text-muted">
            Every swap and liquidity action earns XP on the Integra network.
          </p>
        </div>
      </div>

      {/* Powered by */}
      <div className="mt-16 flex items-center gap-2 text-xs text-plotswap-text-subtle">
        <span>Powered by</span>
        <span className="font-medium text-plotswap-text-muted">
          Integra Layer
        </span>
      </div>
    </div>
  );
}
