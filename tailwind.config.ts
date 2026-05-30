/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vault-gold': '#D4AF37',
        'vault-gold-hover': '#FBBF24',
        'vault-black': '#000000',
        'vault-bg': '#0A0A0A',
        'vault-border': '#1F1F1F',
        'vault-muted': '#71717A',
        'vault-red': '#DC2626',
        'vault-green': '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
