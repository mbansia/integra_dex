"use client";

import { useState, useEffect } from "react";

// Pixel art robot trader mascot — 16x16 grid rendered as SVG
const BODY_COLOR = "#3B82F6";
const BODY_LIGHT = "#60A5FA";
const VISOR_COLOR = "#06B6D4";
const VISOR_GLOW = "#22D3EE";
const ACCENT = "#818CF8";
const DARK = "#1E293B";

// Each row is 16 pixels wide. 1 = body, 2 = light, 3 = visor, 4 = visor glow, 5 = accent, 6 = dark, 0 = transparent
const FRAME_IDLE = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,0,1,2,1,1,1,1,1,1,2,1,0,0,0],
  [0,0,0,1,6,6,3,4,4,3,6,6,1,0,0,0],
  [0,0,0,1,6,6,4,3,3,4,6,6,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,6,1,5,5,1,6,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,2,1,1,1,1,1,1,2,1,1,0,0],
  [0,5,0,1,1,1,1,1,1,1,1,1,1,0,5,0],
  [0,5,0,1,1,2,2,1,1,2,2,1,1,0,5,0],
  [0,5,0,0,1,1,1,1,1,1,1,1,0,0,5,0],
  [0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,6,0,0,6,1,0,0,0,0,0],
  [0,0,0,0,1,1,6,0,0,6,1,1,0,0,0,0],
  [0,0,0,0,5,5,0,0,0,0,5,5,0,0,0,0],
];

// Blink frame — visor dims
const FRAME_BLINK = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,0,1,2,1,1,1,1,1,1,2,1,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,6,6,3,3,3,3,6,6,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,6,1,5,5,1,6,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,2,1,1,1,1,1,1,2,1,1,0,0],
  [0,5,0,1,1,1,1,1,1,1,1,1,1,0,5,0],
  [0,5,0,1,1,2,2,1,1,2,2,1,1,0,5,0],
  [0,5,0,0,1,1,1,1,1,1,1,1,0,0,5,0],
  [0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,6,0,0,6,1,0,0,0,0,0],
  [0,0,0,0,1,1,6,0,0,6,1,1,0,0,0,0],
  [0,0,0,0,5,5,0,0,0,0,5,5,0,0,0,0],
];

const COLOR_MAP: Record<number, string> = {
  1: BODY_COLOR,
  2: BODY_LIGHT,
  3: VISOR_COLOR,
  4: VISOR_GLOW,
  5: ACCENT,
  6: DARK,
};

function renderFrame(frame: number[][], pixelSize: number) {
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      const val = frame[y][x];
      if (val === 0) continue;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * pixelSize}
          y={y * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={COLOR_MAP[val]}
          rx={pixelSize * 0.1}
        />
      );
    }
  }
  return rects;
}

interface PixelMascotProps {
  size?: number;
  className?: string;
}

export function PixelMascot({ size = 128, className = "" }: PixelMascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [bobOffset, setBobOffset] = useState(0);

  // Blink every few seconds
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Idle bobbing
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame += 0.03;
      setBobOffset(Math.sin(frame) * 4);
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  const pixelSize = size / 16;
  const frame = isBlinking ? FRAME_BLINK : FRAME_IDLE;

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ transform: `translateY(${bobOffset}px)` }}
    >
      {/* Glow effect under the character */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full blur-xl"
        style={{
          width: size * 0.6,
          height: size * 0.15,
          background: "rgba(59, 130, 246, 0.3)",
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ imageRendering: "pixelated" }}
      >
        {renderFrame(frame, pixelSize)}
      </svg>
    </div>
  );
}
