/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        "primary-hover": "#4338CA",
        "primary-light": "#EEF2FF",
        "ai-blue": "#2563EB",
      },
    },
  },
  plugins: [],
};
