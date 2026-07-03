/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 4px 20px -6px rgb(0 0 0 / 0.08)",
        "card-hover": "0 10px 40px -12px rgb(0 0 0 / 0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      colors: {
        primary: {
          50: "var(--color-primary-50, #eff6ff)",
          100: "var(--color-primary-100, #dbeafe)",
          200: "var(--color-primary-200, #bfdbfe)",
          300: "var(--color-primary-300, #93c5fd)",
          400: "var(--color-primary-400, #60a5fa)",
          500: "var(--color-primary-500, #3b82f6)",
          600: "var(--color-primary-600, #2563eb)",
          700: "var(--color-primary-700, #1d4ed8)",
          800: "var(--color-primary-800, #1e40af)",
          900: "var(--color-primary-900, #1e3a8a)",
        },
      },
    },
  },
  plugins: [],
};
