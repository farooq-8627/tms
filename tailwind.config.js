/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-inter)", "sans-serif"],
				display: ["var(--font-space-grotesk)", "sans-serif"],
			},
			colors: {
				primary: {
					50: "#f0f9ff",
					100: "#e0f2fe",
					200: "#bae6fd",
					300: "#7dd3fc",
					400: "#38bdf8",
					500: "#0ea5e9",
					600: "#0284c7",
					700: "#0369a1",
					800: "#075985",
					900: "#0c4a6e",
					950: "#082f49",
				},
				secondary: {
					50: "#f5f3ff",
					100: "#ede9fe",
					200: "#ddd6fe",
					300: "#c4b5fd",
					400: "#a78bfa",
					500: "#8b5cf6",
					600: "#7c3aed",
					700: "#6d28d9",
					800: "#5b21b6",
					900: "#4c1d95",
					950: "#2e1065",
				},
			},
			animation: {
				"pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				"open-box": "open-box 2s ease-in-out forwards",
				"fade-in": "fade-in 1s ease-in-out forwards",
			},
			keyframes: {
				"open-box": {
					"0%": { transform: "scale(0.8) rotateX(0deg)" },
					"70%": { transform: "scale(1.1) rotateX(180deg)" },
					"100%": { transform: "scale(1) rotateX(180deg)" },
				},
				"fade-in": {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
			},
			boxShadow: {
				neon: "0 0 5px theme(colors.blue.400), 0 0 20px theme(colors.blue.600)",
				"neon-red":
					"0 0 5px theme(colors.red.400), 0 0 20px theme(colors.red.600)",
				"neon-green":
					"0 0 5px theme(colors.green.400), 0 0 20px theme(colors.green.600)",
				"neon-pulse":
					"0 0 5px theme(colors.blue.400), 0 0 20px theme(colors.blue.600)",
			},
		},
	},
	plugins: [],
};
