/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        unca: {
          50: "#f3f6fb",
          100: "#e6edf7",
          200: "#c6d6ee",
          300: "#93b2df",
          400: "#5f8dd0",
          500: "#2b69c1", // primary
          600: "#2253a0",
          700: "#1b4180",
          800: "#143060",
          900: "#0d2144", // deep header blue
        },
      },
      boxShadow: { card: "0 2px 10px rgba(0,0,0,0.06)" },
      borderRadius: { xl: "0.75rem" },
    },
  },
  plugins: [],
};
