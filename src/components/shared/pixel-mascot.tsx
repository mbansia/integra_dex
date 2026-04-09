"use client";

import { useState, useEffect, useCallback } from "react";

// Pixel broker: suit, tie, briefcase, glasses
// 16x16 grid. 1=suit, 2=shirt, 3=skin, 4=hair, 5=tie, 6=glasses, 7=briefcase, 8=shoe, 9=dark
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
  1: "#3B82F6",  // PlotSwap blue suit
  2: "#E8E8F0",  // white shirt
  3: "#60A5FA",  // light blue skin (stylized)
  4: "#1E3A8A",  // dark blue hair
  5: "#06B6D4",  // cyan tie
  6: "#22D3EE",  // bright cyan glasses
  7: "#6366F1",  // indigo briefcase
  8: "#1E40AF",  // dark blue shoes
  9: "#F0ABFC",  // mouth
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

function renderFrame(frame: number[][], px: number) {
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      if (frame[y][x] === 0) continue;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * px}
          y={y * px}
          width={px}
          height={px}
          fill={COLORS[frame[y][x]]}
        />
      );
    }
  }
  return rects;
}

export function PixelMascot({ size = 96, inline = false }: { size?: number; inline?: boolean }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [bobOffset, setBobOffset] = useState(0);
  const [joke, setJoke] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const [jokeIdx, setJokeIdx] = useState(0);

  // Blink
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const id = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Bob
  useEffect(() => {
    let f = 0;
    const tick = () => {
      f += 0.03;
      setBobOffset(Math.sin(f) * 3);
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-hide joke
  useEffect(() => {
    if (!joke) return;
    const t = setTimeout(() => setJoke(null), 5000);
    return () => clearTimeout(t);
  }, [joke]);

  const handleClick = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 400);
    const randomIdx = Math.floor(Math.random() * JOKES.length);
    setJoke(JOKES[randomIdx]);
  }, []);

  const px = size / 16;

  return (
    <div className={`${inline ? "relative" : "fixed bottom-6 right-6 z-40"} flex flex-col items-end gap-2`}>
      {/* Speech bubble */}
      {joke && (
        <div
          className="animate-speech-pop max-w-[240px] px-3 py-2.5 rounded-xl text-xs leading-relaxed"
          style={{
            background: "var(--ps-card-elevated)",
            border: "1px solid var(--ps-border-strong)",
            color: "var(--ps-text)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <p>{joke}</p>
          <div
            className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
            style={{
              background: "var(--ps-card-elevated)",
              borderRight: "1px solid var(--ps-border-strong)",
              borderBottom: "1px solid var(--ps-border-strong)",
            }}
          />
        </div>
      )}

      {/* Mascot */}
      <button
        onClick={handleClick}
        className={`relative cursor-pointer transition-transform hover:scale-105 ${isBouncing ? "animate-mascot-bounce" : ""}`}
        style={{ transform: `translateY(${bobOffset}px)` }}
        title="Click me for a joke!"
      >
        {/* Glow */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full blur-lg"
          style={{
            width: size * 0.5,
            height: size * 0.1,
            background: "rgba(59, 130, 246, 0.25)",
          }}
        />
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ imageRendering: "pixelated" }}
        >
          {renderFrame(isBlinking ? FRAME_BLINK : FRAME_IDLE, px)}
        </svg>
      </button>
    </div>
  );
}
