
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--q-primary-50) / <alpha-value>)',
          100: 'rgb(var(--q-primary-100) / <alpha-value>)',
          200: 'rgb(var(--q-primary-200) / <alpha-value>)',
          300: 'rgb(var(--q-primary-300) / <alpha-value>)',
          400: 'rgb(var(--q-primary-400) / <alpha-value>)',
          500: 'rgb(var(--q-primary-500) / <alpha-value>)',
          600: 'rgb(var(--q-primary-600) / <alpha-value>)',
          700: 'rgb(var(--q-primary-700) / <alpha-value>)',
          800: 'rgb(var(--q-primary-800) / <alpha-value>)',
          900: 'rgb(var(--q-primary-900) / <alpha-value>)',
          950: 'rgb(var(--q-primary-950) / <alpha-value>)',
        },

        accent: {
          50: 'rgb(var(--q-accent-50) / <alpha-value>)',
          100: 'rgb(var(--q-accent-100) / <alpha-value>)',
          200: 'rgb(var(--q-accent-200) / <alpha-value>)',
          300: 'rgb(var(--q-accent-300) / <alpha-value>)',
          400: 'rgb(var(--q-accent-400) / <alpha-value>)',
          500: 'rgb(var(--q-accent-500) / <alpha-value>)',
          600: 'rgb(var(--q-accent-600) / <alpha-value>)',
          700: 'rgb(var(--q-accent-700) / <alpha-value>)',
          800: 'rgb(var(--q-accent-800) / <alpha-value>)',
          900: 'rgb(var(--q-accent-900) / <alpha-value>)',
        },

        surface: {
          50: 'rgb(var(--q-surface-50) / <alpha-value>)',
          100: 'rgb(var(--q-surface-100) / <alpha-value>)',
          200: 'rgb(var(--q-surface-200) / <alpha-value>)',
          300: 'rgb(var(--q-surface-300) / <alpha-value>)',
          400: 'rgb(var(--q-surface-400) / <alpha-value>)',
          500: 'rgb(var(--q-surface-500) / <alpha-value>)',
          600: 'rgb(var(--q-surface-600) / <alpha-value>)',
          700: 'rgb(var(--q-surface-700) / <alpha-value>)',
          800: 'rgb(var(--q-surface-800) / <alpha-value>)',
          900: 'rgb(var(--q-surface-900) / <alpha-value>)',
          950: 'rgb(var(--q-surface-950) / <alpha-value>)',
        },
      },

      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
