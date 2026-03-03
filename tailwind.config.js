/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#155EEF", foreground: "#ffffff" },
        accent: { DEFAULT: "#0CAF60", foreground: "#ffffff" },
      },
    },
  },
  plugins: [],
};
