import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-plotswap-border py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-plotswap-text-muted">
          <span>PlotSwap.markets</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/docs" className="hover:text-plotswap-text transition-colors">
              Docs
            </Link>
            <Link href="/brand" className="hover:text-plotswap-text transition-colors">
              Brand Kit
            </Link>
            <a
              href="https://dashboard.integralayer.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-plotswap-text transition-colors"
            >
              Integra Dashboard
            </a>
            <a
              href="https://docs.integralayer.com/tools/?tab=faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-plotswap-text transition-colors"
            >
              Faucet
            </a>
            <a
              href="https://explorer.integralayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-plotswap-text transition-colors"
            >
              Explorer
            </a>
            <span className="text-plotswap-text-subtle">
              Powered by Integra Testnet
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
