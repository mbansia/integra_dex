import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MascotWrapper } from "@/components/shared/mascot-wrapper";
import { Web3Provider } from "@/providers/web3-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlotSwap | DEX for Tokenized Real Estate",
  description:
    "Swap ERC-20 and ERC-1404 tokens with automated liquidity. Built for real-world assets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans antialiased" style={{ background: "var(--ps-bg)", color: "var(--ps-text)" }}>
        <Web3Provider>
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <MascotWrapper />
        </Web3Provider>
      </body>
    </html>
  );
}
