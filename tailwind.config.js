/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        // Cream/parchment backgrounds of the free experience (mockups)
        parchment: {
          50: '#fdfaf2',
          100: '#f7f1e3',
          200: '#efe3c8',
        },
        // Dark navy of the premium "Go deeper" screen
        navy: {
          600: '#2c3e66',
          700: '#22304f',
          800: '#182a40',
          850: '#131c36',
          900: '#0f1730',
          950: '#111f46',
        },
      },
    },
  },
  plugins: [],
}
