const globalConfig = require("tailwind-config/tailwind.config");

module.exports = {
  ...globalConfig,
  theme: {
    extend: {
      colors: {
        primary: "#F25118",
      },
      fontFamily: {
        sans: ["var(--font-geomanist)"],
        mono: ["var(--font-silka-mono)"],
      },
      backgroundImage: {
        "gradient-30": "linear-gradient(30deg, var(--tw-gradient-stops))",
      },
      future: {
        hoverOnlyWhenSupported: true,
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
