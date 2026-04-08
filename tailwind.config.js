/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plotswap: {
          primary: "#6366F1",
          "primary-hover": "#4F46E5",
          "primary-light": "#818CF8",
          accent: "#06B6D4",
          "accent-light": "#22D3EE",
          bg: "#0B0B14",
          card: "rgba(17, 17, 35, 0.8)",
          "card-elevated": "rgba(25, 25, 50, 0.7)",
          border: "rgba(99, 102, 241, 0.12)",
          "border-strong": "rgba(99, 102, 241, 0.25)",
          text: "#E8E8F0",
          "text-muted": "#9CA3AF",
          "text-subtle": "#6B7280",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
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
        "plotswap-gradient": "linear-gradient(135deg, #6366F1, #06B6D4)",
        "plotswap-button": "linear-gradient(135deg, #6366F1, #8B5CF6)",
        "plotswap-text": "linear-gradient(135deg, #818CF8, #06B6D4, #6366F1)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.2)",
      },
    },
  },
  plugins: [],
};
