import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-plotswap-border py-6 mt-auto bg-plotswap-bg relative z-10">
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
            <Link href="/wrap" className="hover:text-plotswap-text transition-colors">
              Wrap
            </Link>
            <a
              href="https://x.com/plot_swap"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-plotswap-text transition-colors flex items-center gap-1.5"
              title="Follow PlotSwap on X"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
