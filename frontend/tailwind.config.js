/** @type {import('tailwindcss').Config} */
const { palette, font, gradient, shadow } = require('./src/theme/tokens');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: palette.indigo,
        secondary: palette.violet,
      },
      fontFamily: {
        sans: font.sans,
      },
      boxShadow: {
        soft: shadow.xs,
        card: shadow.sm,
        raised: shadow.md,
        lift: shadow.lg,
        popover: shadow.popover,
      },
      backgroundImage: {
        'brand-gradient': gradient.brand,
        'brand-soft': gradient.brandSoft,
        'app-canvas': gradient.canvas,
        'sidebar-gradient': gradient.sidebar,
      },
      borderRadius: {
        xl2: '16px',
      },
    },
  },
  plugins: [],
}
