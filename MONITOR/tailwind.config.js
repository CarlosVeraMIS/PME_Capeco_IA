/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#03132d',
        'surface-low': '#0b1b36',
        'surface-mid': '#101f3a',
        'surface-high': '#1b2a45',
        'surface-highest': '#263551',
        primary: '#a7c8ff',
        'primary-container': '#0058a7',
        cyan: '#26B7FF',
        green: '#2fe0a2',
        'on-surface': '#d8e2ff',
        'on-surface-variant': '#c2c6d3',
        outline: '#8c919d',
        error: '#ffb4ab',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      backdropBlur: {
        glass: '10px',
        'glass-lg': '20px',
      },
      boxShadow: {
        glow: '0 4px 16px rgba(38,183,255,0.15)',
        'glow-green': '0 4px 16px rgba(47,224,162,0.15)',
      },
    },
  },
  plugins: [],
}
