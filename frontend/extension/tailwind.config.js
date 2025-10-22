/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FBB500', // Dourado Vetra
        'dark-bg': '#121212',
        'dark-card': '#1E1E1E',
        'dark-text': '#E6E6E6',
        'dark-border': '#333333',
        'risk-low': '#00D386',
        'risk-medium': '#F5A524',
        'risk-high': '#AC1010',
      },
      fontFamily: {
        'arial': ['Arial', 'sans-serif'],
        'sans': ['Arial', 'system-ui', 'sans-serif'],
      },
      width: {
        'popup': '420px',
      },
      height: {
        'popup': '600px',
      },
    },
  },
  plugins: [],
}