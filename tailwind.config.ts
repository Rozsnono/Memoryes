import type { Config } from "tailwindcss";

const config: Config = {
    // CRITICAL: Make sure these paths match your folder structure exactly
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                memoryes: {
                    background: "#FDFCFB",
                    primary: "#9B86BD",
                    soft: "#F3E5F5",
                    accent: "#FFD1DC",
                    mint: "#E0F2F1",
                    clay: "#4A4E69",
                },
            },
        },
    },
    plugins: [],
};
export default config;