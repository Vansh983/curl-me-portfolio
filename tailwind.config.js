module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class", // this is for enabling dark mode.
  theme: {
    extend: {
      colors: {
        light: {
          DEFAULT: "#FFFFFF",
        },
        dark: {
          DEFAULT: "#000000",
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
