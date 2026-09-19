/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          rose: '#F3D5D8',
          roseHover: '#E8BFC4',
          sky: '#DFE7F2',
          skyHover: '#C9D8EC',
          mint: '#E2ECE9',
          mintHover: '#C8DCD6',
          peach: '#FDE8E0',
          peachHover: '#F7CEBF',
          sage: '#E2EFCB',
          gray: '#8E8E93',
          lightGray: '#F2F2F7',
          charcoal: '#3A3A3C',
          dark: '#1C1C1E'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif']
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      boxShadow: {
        'pastel-soft': '0 10px 30px -5px rgba(243, 213, 216, 0.3)',
        'pastel-card': '0 4px 20px 0px rgba(0, 0, 0, 0.04)',
        'pastel-hover': '0 12px 35px 0px rgba(0, 0, 0, 0.08)'
      }
    },
  },
  plugins: [],
}
