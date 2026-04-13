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
          </div>
        </div>
      </div>
    </footer>
  );
}
