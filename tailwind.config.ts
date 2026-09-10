import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0A',
          soft: '#111111',
          card: '#1A1A1A',
          lighter: '#222222'
        },
        gold: {
          DEFAULT: '#D4AF37',
          dark: '#B8860B',
          light: '#F0D97A'
        },
        main: '#FFFFFF',
        sub: '#B0B0B0'
      },
      fontFamily: {
        display: ['Oswald', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        gold: '0 0 24px rgba(212, 175, 55, 0.35)',
        card: '0 8px 30px rgba(0, 0, 0, 0.55)'
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, #B8860B 0%, #D4AF37 45%, #F0D97A 55%, #D4AF37 100%)',
        'dark-gradient': 'linear-gradient(180deg, #111111 0%, #0A0A0A 100%)'
      }
    }
  },
  plugins: []
};

export default config;
