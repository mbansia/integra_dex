import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-pulse-glow"
          style={{
            top: "-10%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-pulse-glow"
          style={{
            bottom: "-5%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full animate-pulse-glow"
          style={{
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
            animationDelay: "4s",
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 animate-grid-fade"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Orbiting particles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-orbit">
            <div className="w-2 h-2 rounded-full bg-plotswap-primary/60 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-orbit-reverse">
            <div className="w-1.5 h-1.5 rounded-full bg-plotswap-accent/60 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
        </div>

        {/* Floating shapes */}
        <div
          className="absolute animate-float"
          style={{ top: "15%", left: "8%" }}
        >
          <div className="w-16 h-16 rounded-2xl border border-plotswap-primary/10 bg-plotswap-primary/5 rotate-12" />
        </div>
        <div
          className="absolute animate-float-reverse"
          style={{ top: "20%", right: "10%" }}
        >
          <div className="w-12 h-12 rounded-full border border-plotswap-accent/10 bg-plotswap-accent/5" />
        </div>
        <div
          className="absolute animate-float"
          style={{ bottom: "25%", left: "12%", animationDelay: "3s" }}
        >
          <div className="w-10 h-10 rounded-xl border border-plotswap-primary/10 bg-plotswap-primary/5 -rotate-6" />
        </div>
        <div
          className="absolute animate-float-reverse"
          style={{ bottom: "20%", right: "8%", animationDelay: "1.5s" }}
        >
          <div className="w-14 h-14 rounded-2xl border border-purple-500/10 bg-purple-500/5 rotate-45" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16">
        {/* Badge */}
        <div className="animate-fade-up mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-plotswap-primary/20 bg-plotswap-primary/5">
            <div className="w-1.5 h-1.5 rounded-full bg-plotswap-success animate-pulse" />
            <span className="text-xs font-medium text-plotswap-primary-light">
              Live on Integra Testnet
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto animate-fade-up">
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span
              className="animate-shimmer inline-block"
              style={{
                background: "linear-gradient(90deg, #818CF8, #06B6D4, #8B5CF6, #818CF8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Trade tokens
            </span>
            <br />
            <span className="text-white">on Integra</span>
          </h1>
        </div>

        <p className="text-lg sm:text-xl text-plotswap-text-muted mb-10 max-w-lg mx-auto text-center animate-fade-up-delay leading-relaxed">
          Swap ERC-20 and ERC-1404 security tokens with automated market
          making. Low fees. Instant settlement.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4 justify-center animate-fade-up-delay">
          <Link
            href="/swap"
            className="group relative px-8 py-4 text-base font-semibold text-white rounded-xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
          >
            <div className="absolute inset-0 bg-plotswap-button transition-opacity group-hover:opacity-90" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-plotswap-primary via-purple-500 to-plotswap-accent" />
            <span className="relative">Launch App</span>
          </Link>
          <Link
            href="/pool"
            className="px-8 py-4 text-base font-semibold rounded-xl border border-plotswap-border hover:border-plotswap-primary/40 hover:bg-plotswap-primary/5 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          >
            Add Liquidity
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl w-full mt-20 animate-fade-up-delay-2">
          {[
            { label: "Protocol", value: "PlotSwap", color: "#6366F1" },
            { label: "Network", value: "Integra Testnet", color: "#06B6D4" },
            { label: "Swap Fee", value: "0.3%", color: "#8B5CF6" },
            { label: "Standards", value: "ERC-20 & 1404", color: "#06B6D4" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group relative p-4 sm:p-5 rounded-xl border border-plotswap-border bg-[#0e0e1e]/80 text-center transition-all hover:border-plotswap-border-strong hover:bg-[#111128]/80"
            >
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at center, ${stat.color}08 0%, transparent 70%)`,
                }}
              />
              <div className="relative">
                <div className="text-lg sm:text-xl font-bold mb-1">{stat.value}</div>
                <div className="text-[11px] sm:text-xs text-plotswap-text-muted uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mt-12 animate-fade-up-delay-3">
          {[
            {
              title: "AMM Powered",
              desc: "Constant product market maker ensures instant swaps with deep liquidity pools.",
              color: "#818CF8",
              icon: (
                <path
                  d="M3 10h4l2-6 3 12 2-6h3"
                  stroke="#818CF8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ),
            },
            {
              title: "Security Tokens",
              desc: "First-class ERC-1404 support with on-chain compliance and whitelist checks.",
              color: "#06B6D4",
              icon: (
                <>
                  <rect x="3" y="3" width="14" height="14" rx="3" stroke="#06B6D4" strokeWidth="1.5" />
                  <path d="M7 10l2 2 4-4" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ),
            },
            {
              title: "Earn XP",
              desc: "Every swap and liquidity action earns XP on the Integra network ecosystem.",
              color: "#F59E0B",
              icon: (
                <>
                  <circle cx="10" cy="10" r="7" stroke="#F59E0B" strokeWidth="1.5" />
                  <path d="M10 6v4l3 2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl border border-plotswap-border bg-[#0e0e1e]/80 transition-all hover:border-plotswap-border-strong hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top left, ${feature.color}10 0%, transparent 60%)`,
                }}
              />
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${feature.color}15` }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-plotswap-text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Powered by */}
        <div className="mt-20 flex items-center gap-3 text-xs text-plotswap-text-subtle animate-fade-up-delay-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-plotswap-border" />
          <span>Powered by</span>
          <span className="font-medium text-plotswap-text-muted">
            Integra Layer
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-plotswap-border" />
        </div>
      </div>
    </div>
  );
}
