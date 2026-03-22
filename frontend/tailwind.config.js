/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        body: '#050505',
        paper: '#0f0f0f',
        surface: '#181818',
        'surface-hover': '#1e1e1e',
        'border-subtle': '#222222',
        'border-strong': '#333333',
        muted: '#888888',
        'muted-dim': '#555555',
        accent: {
          green: '#00ff66',
          red: '#ff3366',
          amber: '#f59e0b',
          blue: '#3b82f6',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        inner: '12px',
        pill: '9999px',
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(0, 255, 102, 0.2)',
        'glow-green-strong': '0 0 25px rgba(0, 255, 102, 0.35)',
        'glow-red': '0 0 15px rgba(255, 51, 102, 0.2)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3)',
        'app-window': '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      animation: {
        'pulse-green': 'pulse-green 1.5s ease-in-out infinite',
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'bounce-press': 'bounce-press 0.15s ease-out',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 255, 102, 0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 255, 102, 0.3)' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 51, 102, 0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 51, 102, 0.3)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
