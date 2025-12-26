/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  daisyui: {
    themes: [
      {
        bumblebee: {
          ...require("daisyui/src/colors/themes")["[data-theme=bumblebee]"],
          primary: "#4f46e5",
          "primary-focus": "#4338ca",
          "base-200": "#e5e7eb",
        },
      },
      "dark",
    ],
  },
  plugins: [require("daisyui")],
};
