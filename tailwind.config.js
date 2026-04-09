/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent colors — same in both modes
        plotswap: {
          primary: "#3B82F6",
          "primary-hover": "#2563EB",
          "primary-light": "#60A5FA",
          accent: "#06B6D4",
          "accent-light": "#22D3EE",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
          // Theme-responsive via CSS variables
          bg: "var(--ps-bg)",
          card: "var(--ps-card)",
          "card-elevated": "var(--ps-card-elevated)",
          border: "var(--ps-border)",
          "border-strong": "var(--ps-border-strong)",
          text: "var(--ps-text)",
          "text-muted": "var(--ps-text-muted)",
          "text-subtle": "var(--ps-text-subtle)",
        },
      },
      fontFamily: {
        sans: ['"Euclid Circular B"', "Verdana", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backgroundImage: {
        "plotswap-gradient": "linear-gradient(135deg, #3B82F6, #06B6D4)",
        "plotswap-button": "linear-gradient(135deg, #3B82F6, #6366F1)",
        "plotswap-text": "linear-gradient(135deg, #60A5FA, #06B6D4, #3B82F6)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.2)",
      },
    },
  },
  plugins: [],
};
