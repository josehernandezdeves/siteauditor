/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "panel de diagnóstico": azul-tinta profundo en vez del
        // negro casi puro genérico, con un ámbar de señal como único acento vivo.
        ink: {
          950: '#0B0E14',
          900: '#12151C',
          800: '#181D28',
          700: '#1F2530',
          600: '#2A3140',
          500: '#3A4356',
        },
        mist: {
          400: '#5B6577',
          300: '#8B94A3',
          200: '#B8C0CC',
          100: '#E8EAED',
        },
        signal: {
          DEFAULT: '#F0A93C',
          soft: '#F0A93C1A',
          dim: '#C4842A',
        },
        health: {
          good: '#3DDC97',
          goodSoft: '#3DDC971A',
          warn: '#F0A93C',
          warnSoft: '#F0A93C1A',
          bad: '#E8574D',
          badSoft: '#E8574D1A',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        scan: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        dash: {
          from: { strokeDashoffset: '0' },
        },
      },
      animation: {
        scan: 'scan 2.2s linear infinite',
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
