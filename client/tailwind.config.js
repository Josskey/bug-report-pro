export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f7ff",
          100: "#e6efff",
          200: "#cddfff",
          300: "#a4c4ff",
          400: "#6ea1ff",
          500: "#3a7aff",
          600: "#215ae6",
          700: "#1a47b4",
          800: "#173c93",
          900: "#122b66"
        }
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
};
