"use client";

import { useState, useEffect, useCallback } from "react";

// Pixel broker: suit, tie, briefcase, glasses — 16x16 grid
const FRAME_IDLE = [
  [0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,0,0,3,6,3,3,3,3,6,3,0,0,0,0],
  [0,0,0,0,3,6,3,3,3,3,6,3,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,0,0,3,3,3,9,3,3,3,3,0,0,0,0],
  [0,0,0,0,0,2,5,2,2,5,2,0,0,0,0,0],
  [0,0,0,1,1,2,5,2,2,5,2,1,1,0,0,0],
  [0,0,0,1,1,1,5,1,1,5,1,1,1,0,0,0],
  [0,0,3,1,1,1,1,1,1,1,1,1,1,3,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,0,0,1,1,1,7,7,0,0],
  [0,0,0,0,0,1,1,0,0,1,1,0,7,7,0,0],
  [0,0,0,0,0,8,8,0,0,8,8,0,0,0,0,0],
  [0,0,0,0,8,8,8,0,0,8,8,8,0,0,0,0],
];

const FRAME_BLINK = [
  [0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,0,0,3,6,6,3,3,6,6,3,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,0,0,3,3,3,9,3,3,3,3,0,0,0,0],
  [0,0,0,0,0,2,5,2,2,5,2,0,0,0,0,0],
  [0,0,0,1,1,2,5,2,2,5,2,1,1,0,0,0],
  [0,0,0,1,1,1,5,1,1,5,1,1,1,0,0,0],
  [0,0,3,1,1,1,1,1,1,1,1,1,1,3,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,0,0,1,1,1,7,7,0,0],
  [0,0,0,0,0,1,1,0,0,1,1,0,7,7,0,0],
  [0,0,0,0,0,8,8,0,0,8,8,0,0,0,0,0],
  [0,0,0,0,8,8,8,0,0,8,8,8,0,0,0,0],
];

const COLORS: Record<number, string> = {
  1: "#3B82F6", 2: "#E8E8F0", 3: "#60A5FA", 4: "#1E3A8A",
  5: "#06B6D4", 6: "#22D3EE", 7: "#6366F1", 8: "#1E40AF", 9: "#F0ABFC",
};

const JOKES = [
  "I tokenized my house. Now my landlord accepts gas fees.",
  "AI tried to flip a property on-chain. Got rugged by the HOA.",
  "My real estate agent is a smart contract. No small talk, just gas.",
  "Tokenized my garage. It has more liquidity than my savings.",
  "An AI walked into a DAO and said: 'I'd like to buy a fraction of Manhattan.'",
  "On-chain real estate: where your house keys are literally private keys.",
  "My AI agent bought land in the metaverse AND Dubai. Guess which had higher gas fees?",
  "They said blockchain would disrupt real estate. My mortgage disagrees.",
  "I asked an AI to appraise my tokenized condo. It said 'insufficient liquidity.'",
  "Tokenized homes: finally, 0.003% of a bathroom is a real investment.",
  "My AI landlord never sleeps, never eats, and always raises the rent on time.",
  "Put my house in a liquidity pool. Now strangers own my kitchen.",
];

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  { q: "What is PlotSwap?", a: "PlotSwap is a decentralized exchange (DEX) on Integra Testnet. It uses an automated market maker (AMM) to let you swap tokens instantly without an order book." },
  { q: "How do I swap tokens?", a: "Connect your wallet, select the tokens you want to trade, enter an amount, and click Swap. You'll need IRL (the native token) for gas fees." },
  { q: "What are ERC-1404 tokens?", a: "ERC-1404 is a security token standard with built-in transfer restrictions. PlotSwap checks whitelist compliance before every trade — if you're not approved, the swap is blocked before it reaches your wallet." },
  { q: "How do I get testnet IRL?", a: "Visit the Integra faucet at docs.integralayer.com/tools to get free testnet IRL tokens for testing." },
  { q: "What is a liquidity pool?", a: "A pool holds two tokens and lets traders swap between them. When you add liquidity, you deposit both tokens and earn 0.25% of every swap fee in return." },
  { q: "What's the swap fee?", a: "0.3% per trade — 0.25% goes to liquidity providers and 0.05% is an optional protocol fee." },
  { q: "How does the whitelist check work?", a: "For ERC-1404 tokens, PlotSwap calls detectTransferRestriction() before sending the transaction to your wallet. If you're not on the token's whitelist, you'll see the exact restriction reason in the UI." },
  { q: "What wallets are supported?", a: "Any browser wallet like MetaMask, Rabby, or Coinbase Wallet. Social login via Web3Auth (Google, Email, etc.) is coming soon." },
  { q: "Is this real money?", a: "No! PlotSwap is on Integra Testnet. All tokens are test tokens with no real value. It's a sandbox for trying out DeFi." },
  { q: "What is XP?", a: "Every swap and liquidity action emits an XP event on-chain. XP is tracked across the Integra ecosystem for rewards and reputation." },
];

function renderFrame(frame: number[][], px: number) {
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      if (frame[y][x] === 0) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={COLORS[frame[y][x]]} />
      );
    }
  }
  return rects;
}

type MascotMode = "idle" | "joke" | "help";

export function PixelMascot({ size = 96, inline = false }: { size?: number; inline?: boolean }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [bobOffset, setBobOffset] = useState(0);
  const [mode, setMode] = useState<MascotMode>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const blink = () => { setIsBlinking(true); setTimeout(() => setIsBlinking(false), 150); };
    const id = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let f = 0;
    const tick = () => { f += 0.03; setBobOffset(Math.sin(f) * 3); requestAnimationFrame(tick); };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-hide joke
  useEffect(() => {
    if (mode !== "joke" || !message) return;
    const t = setTimeout(() => { setMessage(null); setMode("idle"); }, 5000);
    return () => clearTimeout(t);
  }, [message, mode]);

  const handleJoke = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 400);
    setMessage(JOKES[Math.floor(Math.random() * JOKES.length)]);
    setMode("joke");
    setExpandedFaq(null);
  }, []);

  const toggleHelp = useCallback(() => {
    if (mode === "help") {
      setMode("idle");
      setExpandedFaq(null);
    } else {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 400);
      setMode("help");
      setMessage(null);
      setExpandedFaq(null);
    }
  }, [mode]);

  const handleMascotClick = useCallback(() => {
    if (mode === "help") return; // Don't switch to joke when help is open
    handleJoke();
  }, [mode, handleJoke]);

  if (inline) {
    // Inline version (homepage) — just the character, click for joke
    return (
      <div className="relative flex flex-col items-center gap-2">
        {message && mode === "joke" && (
          <div
            className="animate-speech-pop max-w-[260px] px-3 py-2.5 rounded-xl text-xs leading-relaxed text-center"
            style={{ background: "var(--ps-card-elevated)", border: "1px solid var(--ps-border-strong)", color: "var(--ps-text)" }}
          >
            {message}
          </div>
        )}
        <button
          onClick={handleJoke}
          className={`relative cursor-pointer transition-transform hover:scale-105 ${isBouncing ? "animate-mascot-bounce" : ""}`}
          style={{ transform: `translateY(${bobOffset}px)` }}
          title="Click me!"
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full blur-lg" style={{ width: size * 0.5, height: size * 0.1, background: "rgba(59,130,246,0.25)" }} />
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: "pixelated" }}>
            {renderFrame(isBlinking ? FRAME_BLINK : FRAME_IDLE, size / 16)}
          </svg>
        </button>
      </div>
    );
  }

  // Fixed version (all pages) — joke + help panel
  const px = size / 16;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Help panel */}
      {mode === "help" && (
        <div
          className="animate-speech-pop w-[300px] rounded-xl overflow-hidden"
          style={{ background: "var(--ps-card-elevated)", border: "1px solid var(--ps-border-strong)", color: "var(--ps-text)", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--ps-border)" }}>
            <span className="text-sm font-semibold">PlotSwap Help</span>
            <button onClick={toggleHelp} className="text-lg leading-none" style={{ color: "var(--ps-text-muted)" }}>&times;</button>
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b" style={{ borderColor: "var(--ps-border)" }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left px-4 py-3 text-xs font-medium flex items-center justify-between gap-2 transition-colors hover:bg-plotswap-primary/5"
                  style={{ color: "var(--ps-text)" }}
                >
                  <span>{faq.q}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`flex-shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`}
                    style={{ color: "var(--ps-text-muted)" }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-3 text-xs leading-relaxed" style={{ color: "var(--ps-text-muted)" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--ps-border)" }}>
            <button
              onClick={handleJoke}
              className="text-[11px] text-plotswap-primary hover:text-plotswap-primary-hover transition-colors"
            >
              Tell me a joke instead
            </button>
          </div>
        </div>
      )}

      {/* Joke bubble */}
      {mode === "joke" && message && (
        <div
          className="animate-speech-pop max-w-[240px] px-3 py-2.5 rounded-xl text-xs leading-relaxed relative"
          style={{ background: "var(--ps-card-elevated)", border: "1px solid var(--ps-border-strong)", color: "var(--ps-text)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
        >
          <p>{message}</p>
          <div
            className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
            style={{ background: "var(--ps-card-elevated)", borderRight: "1px solid var(--ps-border-strong)", borderBottom: "1px solid var(--ps-border-strong)" }}
          />
        </div>
      )}

      {/* Mascot + help button row */}
      <div className="flex items-end gap-2">
        {/* Help button */}
        <button
          onClick={toggleHelp}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${mode === "help" ? "bg-plotswap-primary text-white" : "bg-plotswap-primary/15 text-plotswap-primary hover:bg-plotswap-primary/25"}`}
          title="Help & FAQs"
        >
          ?
        </button>

        {/* Character */}
        <button
          onClick={handleMascotClick}
          className={`relative cursor-pointer transition-transform hover:scale-105 ${isBouncing ? "animate-mascot-bounce" : ""}`}
          style={{ transform: `translateY(${bobOffset}px)` }}
          title="Click me for a joke!"
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full blur-lg" style={{ width: size * 0.5, height: size * 0.1, background: "rgba(59,130,246,0.25)" }} />
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: "pixelated" }}>
            {renderFrame(isBlinking ? FRAME_BLINK : FRAME_IDLE, px)}
          </svg>
        </button>
      </div>
    </div>
  );
}
