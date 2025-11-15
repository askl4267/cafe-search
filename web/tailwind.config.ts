import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './styles/**/*.{css}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"M PLUS Rounded 1c"', 'system-ui', 'sans-serif'],
        display: ['"Shippori Mincho"', 'serif'],
      },
      colors: {
        coffee: { 50: '#fbf6f2', 100: '#f4ebe4', 200: '#e7d8c6', 300: '#d7c1a5', 400: '#c5a37d', 500: '#a77f57', 600: '#8b6647', 700: '#6f523a', 800: '#584231', 900: '#46352a' },
        cream: { 50: '#fffdfa', 100: '#fff8ee', 200: '#fff1db' },
        leaf: { 400: '#7bb08f', 500: '#6aa680', 600: '#5a8e6d' },
      },
      boxShadow: {
        card: '0 6px 22px rgba(70,53,42,.08), 0 1px 0 rgba(70,53,42,.06)',
      },
    },
  },
  plugins: [],
};

export default config;
