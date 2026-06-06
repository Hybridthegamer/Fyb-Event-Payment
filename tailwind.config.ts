import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#2C0A0A',
        'bg-secondary': '#3D1010',
        'card-surface': '#4A1515',
        'accent-gold': '#C9A227',
        'accent-gold-light': '#E8C84A',
        'text-muted': '#C4A882',
        'success-green': '#2ECC71',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
