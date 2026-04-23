"use client";

import { useState } from "react";
import { useTokenLogo } from "@/hooks/useTokenLogo";

interface TokenLogoProps {
  address: string;
  symbol: string;
  logoURI?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackTextClassName?: string;
}

export function TokenLogo({
  address,
  symbol,
  logoURI,
  className = "w-8 h-8",
  fallbackClassName = "bg-plotswap-primary/20 text-plotswap-primary",
  fallbackTextClassName = "text-xs",
}: TokenLogoProps) {
  const logoUrl = useTokenLogo(address, logoURI || undefined);
  const [broken, setBroken] = useState(false);

  if (logoUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={symbol}
        className={`${className} rounded-full object-cover bg-plotswap-card`}
        onError={() => setBroken(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold ${fallbackTextClassName} ${fallbackClassName}`}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}
