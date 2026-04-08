"use client";

export function PlotswapLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
        <path
          d="M12 28L16 16L20 22L24 14L28 20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="20" r="2" fill="white" />
        <defs>
          <linearGradient
            id="logo-gradient"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="font-bold text-lg tracking-tight"
        style={{
          background: "linear-gradient(135deg, #818CF8, #06B6D4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        PlotSwap
      </span>
    </div>
  );
}
