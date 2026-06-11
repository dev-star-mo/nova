import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8ef",
          100: "#f9ecd4",
          200: "#f2d9a9",
          300: "#ebc67e",
          400: "#e4b353",
          500: "#d99b28",
          600: "#c5a059", // Premium Gold
          700: "#a38249",
          800: "#816439",
          900: "#5f4629",
        },
        onyx: {
          DEFAULT: "#09090b",
          50: "#f4f4f5",
          100: "#e4e4e7",
          200: "#d4d4d8",
          300: "#a1a1aa",
          400: "#71717a",
          500: "#52525b",
          600: "#3f3f46",
          700: "#27272a",
          800: "#18181b",
          900: "#09090b",
          950: "#040405",
        },
        ink: "#09090b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "premium-gradient": "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
