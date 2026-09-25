/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdbff",
          400: "#5b9dff",
          500: "#2f7dfb",
          600: "#1a5fe0",
          700: "#1849ad",
          900: "#132d63",
        },
      },
    },
  },
  plugins: [],
};
