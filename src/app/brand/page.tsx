"use client";

import { useState } from "react";
import { PlotswapLogo } from "@/components/shared/plotswap-logo";

const COLORS = [
  { name: "Primary Blue", hex: "#3B82F6", usage: "Buttons, links, active states" },
  { name: "Primary Hover", hex: "#2563EB", usage: "Hover states" },
  { name: "Primary Light", hex: "#60A5FA", usage: "Highlights, secondary accents" },
  { name: "Accent Cyan", hex: "#06B6D4", usage: "Positive actions, glow effects" },
  { name: "Accent Light", hex: "#22D3EE", usage: "Bright accents, badges" },
  { name: "Indigo", hex: "#6366F1", usage: "Gradients, secondary buttons" },
  { name: "Success", hex: "#10B981", usage: "Confirmed states, positive" },
  { name: "Warning", hex: "#F59E0B", usage: "Caution, ERC-1404 badges" },
  { name: "Danger", hex: "#EF4444", usage: "Errors, negative changes" },
];

const DARK_SURFACES = [
  { name: "Background", hex: "#080C16", css: "var(--ps-bg)" },
  { name: "Card", hex: "rgba(12, 18, 35, 0.85)", css: "var(--ps-card)" },
  { name: "Card Elevated", hex: "rgba(16, 24, 48, 0.9)", css: "var(--ps-card-elevated)" },
  { name: "Text", hex: "#E8E8F0", css: "var(--ps-text)" },
  { name: "Text Muted", hex: "#9CA3AF", css: "var(--ps-text-muted)" },
  { name: "Text Subtle", hex: "#6B7280", css: "var(--ps-text-subtle)" },
];

const LIGHT_SURFACES = [
  { name: "Background", hex: "#F0F4FA", css: "var(--ps-bg)" },
  { name: "Card", hex: "rgba(255, 255, 255, 0.9)", css: "var(--ps-card)" },
  { name: "Card Elevated", hex: "rgba(255, 255, 255, 0.97)", css: "var(--ps-card-elevated)" },
  { name: "Text", hex: "#0F172A", css: "var(--ps-text)" },
  { name: "Text Muted", hex: "#475569", css: "var(--ps-text-muted)" },
  { name: "Text Subtle", hex: "#94A3B8", css: "var(--ps-text-subtle)" },
];

function CopyBadge({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="font-mono text-xs text-plotswap-text-muted hover:text-plotswap-primary transition-colors"
    >
      {copied ? "Copied!" : text}
    </button>
  );
}

export default function BrandPage() {
  return (
    <div className="max-w-4xl mx-auto pt-12 px-4 pb-20">
      <h1 className="text-3xl font-bold text-plotswap-text mb-2">Brand Kit</h1>
      <p className="text-plotswap-text-muted mb-10">Colors, logos, and guidelines for PlotSwap.</p>

      {/* Logo */}
      <section className="mb-12" id="logo">
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Logo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-8 flex flex-col items-center gap-4" style={{ background: "#080C16" }}>
            <PlotswapLogo size={48} />
            <span className="text-xs text-gray-400">Dark background</span>
          </div>
          <div className="glass-card p-8 flex flex-col items-center gap-4" style={{ background: "#F0F4FA" }}>
            <PlotswapLogo size={48} />
            <span className="text-xs text-gray-600">Light background</span>
          </div>
        </div>
        <div className="mt-4 glass-card p-6">
          <h3 className="text-sm font-semibold text-plotswap-text mb-2">Logo Gradient</h3>
          <div className="h-12 rounded-lg mb-3" style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }} />
          <CopyBadge text="linear-gradient(135deg, #3B82F6, #06B6D4)" />
        </div>
      </section>

      {/* Brand Colors */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Brand Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLORS.map((c) => (
            <div key={c.hex} className="glass-card p-4">
              <div className="w-full h-16 rounded-lg mb-3" style={{ background: c.hex }} />
              <p className="text-sm font-medium text-plotswap-text">{c.name}</p>
              <CopyBadge text={c.hex} />
              <p className="text-[11px] text-plotswap-text-subtle mt-1">{c.usage}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Surface Colors */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Dark Theme Surfaces</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DARK_SURFACES.map((s) => (
            <div key={s.name + "dark"} className="glass-card p-4">
              <div className="w-full h-12 rounded-lg mb-3 border border-plotswap-border" style={{ background: s.hex }} />
              <p className="text-sm font-medium text-plotswap-text">{s.name}</p>
              <CopyBadge text={s.hex} />
              <p className="text-[11px] text-plotswap-text-subtle mt-1">{s.css}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Light Theme Surfaces</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LIGHT_SURFACES.map((s) => (
            <div key={s.name + "light"} className="glass-card p-4">
              <div className="w-full h-12 rounded-lg mb-3 border border-plotswap-border" style={{ background: s.hex }} />
              <p className="text-sm font-medium text-plotswap-text">{s.name}</p>
              <CopyBadge text={s.hex} />
              <p className="text-[11px] text-plotswap-text-subtle mt-1">{s.css}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Typography</h2>
        <div className="glass-card p-6 space-y-4">
          <div>
            <p className="text-xs text-plotswap-text-muted mb-1">Primary — Euclid Circular B</p>
            <p className="text-3xl font-bold text-plotswap-text">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div>
            <p className="text-xs text-plotswap-text-muted mb-1">Monospace — Geist Mono</p>
            <p className="text-lg font-mono text-plotswap-text">0x5a9E...5C1d</p>
          </div>
          <div className="flex gap-6 pt-2">
            {["400 Regular", "500 Medium", "600 Semibold", "700 Bold"].map((w) => (
              <span key={w} className="text-sm text-plotswap-text" style={{ fontWeight: parseInt(w) }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Gradients */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Gradients</h2>
        <div className="space-y-3">
          {[
            { name: "Brand", css: "linear-gradient(135deg, #3B82F6, #06B6D4)" },
            { name: "Button", css: "linear-gradient(135deg, #3B82F6, #6366F1)" },
            { name: "Text Shimmer", css: "linear-gradient(90deg, #60A5FA, #06B6D4, #3B82F6, #60A5FA)" },
          ].map((g) => (
            <div key={g.name} className="glass-card p-4 flex items-center gap-4">
              <div className="w-24 h-10 rounded-lg flex-shrink-0" style={{ background: g.css }} />
              <div>
                <p className="text-sm font-medium text-plotswap-text">{g.name}</p>
                <CopyBadge text={g.css} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage Guidelines */}
      <section>
        <h2 className="text-lg font-semibold text-plotswap-text mb-4">Guidelines</h2>
        <div className="glass-card p-6 space-y-3 text-sm text-plotswap-text-muted">
          <p><strong className="text-plotswap-text">Do:</strong> Use the blue/cyan gradient for primary brand elements. Keep the dark navy background for dark mode. Use adequate contrast in both themes.</p>
          <p><strong className="text-plotswap-text">Don't:</strong> Stretch or distort the logo. Use the brand colors on clashing backgrounds. Mix purple tones with the blue palette.</p>
          <p><strong className="text-plotswap-text">Spacing:</strong> Maintain at least 1x logo width as clearance around the logo mark.</p>
          <p><strong className="text-plotswap-text">Minimum size:</strong> Logo should not be smaller than 24px in height.</p>
        </div>
      </section>
    </div>
  );
}
