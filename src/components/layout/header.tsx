"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlotswapLogo } from "@/components/shared/plotswap-logo";
import { ConnectButton } from "@/components/shared/connect-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Swap", href: "/swap" },
  { label: "Pool", href: "/pool" },
  { label: "Wrap", href: "/wrap" },
  { label: "Tokens", href: "/tokens" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-plotswap-border bg-plotswap-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0">
            <PlotswapLogo />
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  pathname === item.href
                    ? "bg-plotswap-primary/15 text-plotswap-primary"
                    : "text-plotswap-text-muted hover:text-plotswap-text hover:bg-plotswap-primary/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
