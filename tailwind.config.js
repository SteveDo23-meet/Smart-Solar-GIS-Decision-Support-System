/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f1e',
          surface: '#1a1a2e',
          card: '#16213e',
          border: '#2d3561',
        },
        accent: {
          primary: '#00d4ff',
          secondary: '#00ff88',
          tertiary: '#ff6b00',
        },
      },
      backgroundColor: {
        'dark-bg': '#0f0f1e',
        'dark-surface': '#1a1a2e',
        'dark-card': '#16213e',
      },
      borderColor: {
        'dark-border': '#2d3561',
      },
      textColor: {
        'accent-primary': '#00d4ff',
        'accent-secondary': '#00ff88',
        'accent-tertiary': '#ff6b00',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
