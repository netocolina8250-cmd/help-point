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
          orange: "#f65a00",
          orangeHover: "#e04e00",
          orangeLight: "#fff2e5",
          yellow: "#ffd21a",
          dark: "#3c2116",
          muted: "#765c50",
          cream: "#fffaf2",
        },
      },
    },
  },
  plugins: [],
};
export default config;
