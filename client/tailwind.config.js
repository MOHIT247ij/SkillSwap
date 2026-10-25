/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
          500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#1e1b4b',
        },
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'none' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'scale-in': { '0%': { opacity: 0, transform: 'scale(.95)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(.95)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'slide-in': { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .45s ease-out both',
        'fade-in': 'fade-in .3s ease-out both',
        'scale-in': 'scale-in .2s ease-out both',
        float: 'float 4s ease-in-out infinite',
        blob: 'blob 12s ease-in-out infinite',
        'slide-in': 'slide-in .3s ease-out both',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};
