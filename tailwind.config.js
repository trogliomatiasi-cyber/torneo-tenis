/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tennis: {
          dark: '#1B4332',
          mid: '#2D6A4F',
          green: '#52B788',
          light: '#B7E4C7',
          bg: '#F0F7F4',
          clay: '#C9773A',
        }
      }
    },
  },
  plugins: [],
}
