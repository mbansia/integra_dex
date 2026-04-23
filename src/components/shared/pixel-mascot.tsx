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
  "Tried to ape into a tokenized penthouse. Floor price was literally the floor.",
  "My smart contract landlord sent me an eviction notice. Gas fee: $47.",
  "Real estate agent said 'location, location, location.' I said 'chain ID, chain ID, chain ID.'",
  "Bought 0.0001% of a villa. I now own the doorknob.",
  "My AI realtor showed me 47 properties in 3 seconds. I miss the awkward car rides.",
  "Tokenized my attic. It's my highest-yield asset now.",
  "HOA votes are on-chain now. Still just arguing about lawn height.",
  "My property deed is an NFT. My neighbor's is still a PDF from 1987.",
  "Fractional ownership means 200 people share one parking spot.",
  "AI agent tried to negotiate rent down. Landlord hard-forked the lease.",
  "Put a yield farm on actual farmland. Crops and APY both at 0%.",
  "My house has a token ticker. It's down 15% since the bathroom flooded.",
  "Blockchain made escrow trustless. My realtor is still not trustworthy.",
  "Governance vote to paint the building: 3 year delay, 47 proposals, still beige.",
  "My AI property manager responds in 50ms. Still takes 3 weeks to fix the sink.",
  "Listed my shed as a 'micro-unit NFT.' Got 12 offers.",
  "Smart locks meet smart contracts. Got locked out by a gas fee spike.",
  "The metaverse lot next to mine sold for more than my actual house.",
  "AI appraiser valued my house at 500 ETH. Then ETH dropped 40%.",
  "My rental agreement auto-executes. Including the late fees at 3:00:01 AM.",
  "Minted my lease. OpenSea flagged it as 'suspicious.'",
  "On-chain credit score: 850. Off-chain: 'we'll call you back.'",
  "My building's DAO voted to remove the pool. Liquidity was too low.",
  "Staked my house. Wife asked where we're sleeping tonight.",
  "Property tax is now a gas fee. Still hurts the same.",
  "My condo association runs on Snapshot. Same 3 people vote.",
  "Bridged my house to L2. Commute is way faster.",
  "Wrapped my mortgage into a token. Bank said 'that's not how this works.'",
  "DeFi yield on my garage: 4.2%. Real yield: place to put boxes.",
  "Fractionalized my balcony. 50 people now argue about the plants.",
  "My AI agent bought a house sight unseen. It has great on-chain reviews.",
  "Token-gated open house. Only holders get to see the bathroom.",
  "DAO voted to renovate the kitchen. Quorum not met for 6 months.",
  "Flash-loaned a mansion for a party. Returned it in the same block.",
  "My property's floor price is my actual floor. Literally concrete.",
  "Oracle says my house is worth 2M. Zillow says 800K. I say 'pain.'",
  "Real estate on blockchain: same headaches, cooler receipts.",
  "AI agent said 'buy the dip' on housing. It's been dipping since.",
  "Collateralized my backyard. Got liquidated after the sprinklers broke.",
  "AMM for houses: provide a house and a shed, earn swap fees.",
  "My rent-to-own is a vesting schedule. Cliff period: 30 years.",
  "Permissionless property: anyone can view, nobody can close the deal.",
  "Airdropped keys to a timeshare. Community called it a rug pull.",
  "Validator node in the basement. HOA says it 'violates quiet hours.'",
  "Decentralized Airbnb: guests rate you on-chain. Forever.",
  "Slippage on my home purchase was 12%. Realtor called it 'market conditions.'",
  "Yield farming condos: plant a tenant, harvest rent monthly.",
  "NFT deed means I proved ownership. Still can't get the neighbor to trim their tree.",
  "My house has more token holders than bedrooms.",
  "AI mortgage advisor: 'have you tried borrowing against your NFTs?'",
  "Tokenized my basement. Listed it as a 'high-potential subterranean asset.'",
  "Chainlink oracle for property values. Updates every block. I check every minute.",
  "Got rugged on a timeshare. At least the pool was real.",
  "My property portfolio is one apartment and 47 fractionalized parking spots.",
  "DAO members can't agree on curtain color. Proposal #38 pending.",
  "Impermanent loss on my house: same house, less money. So, normal homeownership.",
  "Web3 open house: scan QR, mint badge, still can't afford it.",
  "My real estate portfolio has a Sharpe ratio. My landlord has a sharp temper.",
  "Listed my closet as a 'compact studio NFT.' Sold in 3 blocks.",
  "AI agent manages 10,000 properties. Still emails me 'per my last message.'",
  "Put my roof on the blockchain. Leaks are now public record.",
  "Cross-chain bridge for deeds: moved my property to Arbitrum. Neighbors confused.",
  "Gas-optimized house tour: 5 rooms in one transaction.",
  "Staking rewards on my apartment: free WiFi and a gym I never use.",
  "MEV bot front-ran my house offer. Got sandwiched by a flipper.",
  "Property taxes should be called 'annual gas fees.'",
  "On-chain title search: instant. Off-chain: 4 weeks and a headache.",
  "My house is a blue-chip asset. Blue because of the mold.",
  "Tokenized the garden shed. Market cap: more than my salary.",
  "AI agent automated rent collection. Now I'm the bad guy faster.",
  "Zero-knowledge proof that I own a house. Wife still wants the address.",
  "My home's TVL is just my stuff plus a couch.",
  "Fractionalized ownership meeting: 400 people, one thermostat.",
  "Blockchain property: immutable record of every noise complaint.",
  "Tried to rugpull my own house. Foundation literally pulled away.",
  "Mint a house, burn a mortgage. The DeFi dream.",
  "The only thing more volatile than crypto is my property's Zestimate.",
  "AI agent negotiated my lease in 0.3 seconds. Took me 3 months to read it.",
  "On-chain landlord review: 1 star. 'Fixed nothing, minted everything.'",
  "My real estate token has more trading volume than my actual street.",
  "Governance proposal: should we allow dogs? 2-year voting period.",
  "Smart contract escrow: trustless, unless the inspector lies.",
  "My apartment building runs on Solana. Outages explain the elevator.",
  "Wrapped my mortgage, staked my equity, lost my shirt. DeFi real estate.",
  "Property deed on IPFS. 'Your home is being pinned, please wait.'",
  "Forked my neighbor's fence design. They called it 'plagiarism.'",
  "My house has a token supply of 1. Extremely low liquidity.",
  "Block explorer for my building: 47 transactions, all noise complaints.",
  "AI staging: your empty apartment, now full of AI-generated furniture.",
  "Proof of residence: harder than proof of work.",
  "Tokenized my doorbell. Ring it to earn XP.",
  "DeFi mortgage: variable rate, immutable regret.",
  "My house appreciates slower than my staking rewards depreciate.",
  "On-chain homeowners insurance: claims processed in 15 blocks. Denied in 16.",
  "Cross-chain rent: paid in ETH, apartment on Integra, confusion everywhere.",
  "My building's whitepaper is longer than the lease agreement.",
  "Real yield from real estate: fixing toilets at 2 AM.",
  "Liquidity mining for landlords: provide units, earn complaints.",
  "AI wrote my listing. 'Sun-drenched chaos nexus with artisanal plumbing issues.'",
];

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  { q: "What is PlotSwap?", a: "PlotSwap is a decentralized exchange (DEX) for tokenized real-world assets. It uses an automated market maker (AMM) to let you swap tokens instantly without an order book." },
  { q: "How do I swap tokens?", a: "Connect your wallet, select the tokens you want to trade, enter an amount, and click Swap. You'll need IRL (the native gas token) for transaction fees." },
  { q: "What are ERC-1404 tokens?", a: "ERC-1404 is a security token standard with built-in transfer restrictions. PlotSwap checks whitelist compliance before every trade — if you're not approved, the swap is blocked before it reaches your wallet." },
  { q: "How do I get test tokens?", a: "Wrap some IRL to WIRL via the Wrap page, or paste any token contract address in the token selector to add it." },
  { q: "What is a liquidity pool?", a: "A pool holds two tokens and lets traders swap between them. When you add liquidity, you deposit both tokens and earn 0.25% of every swap fee in return." },
  { q: "What's the swap fee?", a: "0.3% per trade — 0.25% goes to liquidity providers and 0.05% is an optional protocol fee." },
  { q: "How does the whitelist check work?", a: "For ERC-1404 tokens, PlotSwap calls detectTransferRestriction() before sending the transaction to your wallet. If you're not on the token's whitelist, you'll see the exact restriction reason in the UI." },
  { q: "What wallets are supported?", a: "Any browser wallet — MetaMask, Rabby, Coinbase Wallet, or any injected EVM wallet." },
  { q: "Is this real money?", a: "Currently running on testnet — all tokens are test tokens with no real value. It's a sandbox for trying out DeFi." },
  { q: "What is XP?", a: "Every swap and liquidity action emits an XP event on-chain. XP tracks your activity for rewards, reputation, and potential airdrops." },
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
  const [footerOffset, setFooterOffset] = useState(0);

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

  // Lift mascot above the footer when it scrolls into view (fixed variant only)
  useEffect(() => {
    if (inline) return;
    const footer = document.querySelector("footer");
    if (!footer) return;
    const update = () => {
      const rect = footer.getBoundingClientRect();
      const overlap = Math.max(0, window.innerHeight - rect.top);
      setFooterOffset(overlap);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [inline]);

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
    <div
      className="fixed right-6 z-40 flex flex-col items-end gap-2 transition-[bottom] duration-200 ease-out"
      style={{ bottom: `${24 + footerOffset}px` }}
    >
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
