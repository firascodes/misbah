module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#ffffff',
          dark:  '#0C0E10',
        },
        foreground: {
          light: '#040404',
          dark:  '#ffffff',
        },
        primary: {
          light: '#0C0E10',
          dark:  '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        arabic: ['var(--font-noto-sans-arabic)'],
      },
    },
  },
}
