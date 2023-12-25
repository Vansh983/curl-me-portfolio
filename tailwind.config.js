module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        light: {
          DEFAULT: "#FFFFFF",
        },
        dark: {
          DEFAULT: "#0f172a",
        },
        primary: {
          DEFAULT: "#FF0000",
        },
        secondary: {
          DEFAULT: "#00FF00",
        },
        tertiary: {
          DEFAULT: "#0000FF",
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
