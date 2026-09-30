import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 10px 30px rgba(11, 35, 65, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
