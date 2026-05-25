module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: "var(--gold)",
        "gold-light": "var(--gold-light)",
        dark: "var(--dark)",
        dark2: "var(--dark2)",
        cream: "var(--cream)"
      },
      fontFamily: {
        sans: ["var(--font-sarabun)", "sans-serif"],
        display: ["var(--font-sarabun)", "sans-serif"]
      }
    }
  },
  plugins: []
};
