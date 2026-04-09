import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Web3Provider } from "@/providers/web3-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlotSwap | DEX on Integra",
  description:
    "Trade ERC-20 and ERC-1404 tokens on Integra Testnet. Powered by an automated market maker.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans antialiased" style={{ background: "var(--plotswap-bg)", color: "var(--plotswap-text)" }}>
        <Web3Provider>
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
