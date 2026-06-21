/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, single-hue neutral family + one antique-gold accent
        ink: {
          DEFAULT: "#211b16",
          soft: "#4a4039",
          muted: "#8a7d72",
        },
        gold: {
          DEFAULT: "#a8854f",
          soft: "#c4a572",
          deep: "#8a6a3a",
        },
        cream: {
          DEFAULT: "#f6f1ea",
          deep: "#efe7da",
        },
        paper: "#fffdf9",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Jost", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.22em",
      },
      boxShadow: {
        // Warm, tinted shadows (not pure black) for depth on cream surfaces
        soft: "0 1px 2px rgba(33,27,22,0.04), 0 6px 20px -8px rgba(33,27,22,0.12)",
        lift: "0 12px 40px -12px rgba(33,27,22,0.28)",
        gold: "0 10px 30px -10px rgba(168,133,79,0.45)",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.5s ease both",
      },
    },
  },
  plugins: [],
};
