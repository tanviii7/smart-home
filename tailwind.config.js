/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          bg: '#FAF8F2',
          surface: '#F1EADF',
          card: '#FFFFFF',
          sage: '#DCE7D8',
          'sage-light': '#EEF3EC',
          primary: '#7B9274',
          'primary-hover': '#6A8063',
          dark: '#445B46',
          peach: '#F4E1D7',
          lavender: '#E9E7F2',
          text: '#343A34',
          muted: '#777D74',
          border: '#E8E4DA',
          'border-dark': '#D5CFC2',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(68, 91, 70, 0.05), 0 1px 3px 0 rgba(68, 91, 70, 0.04)',
        'soft-md': '0 4px 20px -3px rgba(68, 91, 70, 0.08), 0 2px 6px -1px rgba(68, 91, 70, 0.05)',
        'soft-lg': '0 10px 30px -4px rgba(68, 91, 70, 0.1), 0 4px 10px -2px rgba(68, 91, 70, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
