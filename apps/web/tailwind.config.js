const globalConfig = require("tailwind-config/tailwind.config");

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#F25118",
      },
      fontFamily: {
        sans: ["--font-geomanist"],
      },
      backgroundImage: {
        "gradient-30": "linear-gradient(30deg, var(--tw-gradient-stops))",
      },
      ...globalConfig.theme,
    },
  },
  ...globalConfig,
};
