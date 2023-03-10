/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./posts/**/*.{js,ts,jsx,tsx,md,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
};
