/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#000000',
          elevated: '#0C0C0E',
          card: '#141416',
          cardHover: '#1B1B1E',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          borderHover: 'rgba(255, 255, 255, 0.16)',
          blue: '#0071E3',
          blueHover: '#0077ED',
          blueSoft: 'rgba(0, 113, 227, 0.12)',
          accent: '#2997FF',
          green: '#30D158',
          greenSoft: 'rgba(48, 209, 88, 0.12)',
          orange: '#FF9F0A',
          orangeSoft: 'rgba(255, 159, 10, 0.12)',
          red: '#FF453A',
          redSoft: 'rgba(255, 69, 58, 0.12)',
          purple: '#BF5AF2',
          purpleSoft: 'rgba(191, 90, 242, 0.12)',
          text: '#F5F5F7',
          secondary: '#86868B',
          tertiary: '#515154',
          divider: 'rgba(255, 255, 255, 0.06)'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          'Menlo',
          'monospace'
        ],
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'apple-card': '0 8px 32px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'apple-glow': '0 0 40px -10px rgba(0, 113, 227, 0.3)',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.025em',
        tight: '-0.015em',
      }
    },
  },
  plugins: [],
}
