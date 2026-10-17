import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          green: "#00ff41",
          dark: "#000000",
          light: "#00ffff",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      screens: {
        'xs': '400px',
      }
    },
  },
  plugins: [],
};
export default config;
