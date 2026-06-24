import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B3A1F',
          50: '#E8F0E9',
          100: '#C5D9C7',
          200: '#9EC2A2',
          300: '#77AB7C',
          400: '#509456',
          500: '#1B3A1F', // Primary brand green
          600: '#163018',
          700: '#112611',
          800: '#0C1C0A',
          900: '#071204',
        },
        gold: {
          DEFAULT: '#D4B800',
          50: '#FFFBE5',
          100: '#FFF7CC',
          200: '#FFF099',
          300: '#FFE866',
          400: '#E6C800',
          500: '#D4B800', // Primary brand yellow
          600: '#AA9300',
          700: '#7F6E00',
          800: '#554900',
          900: '#2A2400',
        },
        red: {
          DEFAULT: '#C0272D',
          500: '#C0272D', // Brand red
          600: '#A02025',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          50: '#FDFCFA',
          100: '#F5F0E8', // Brand cream
          200: '#EBE0D0',
          300: '#E0D0B8',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
