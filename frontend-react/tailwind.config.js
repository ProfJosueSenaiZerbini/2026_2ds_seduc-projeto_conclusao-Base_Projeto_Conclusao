/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F4F1EA',
        'cream-light': '#F7F4EE',
        'red-editorial': '#C8102E', // Vermelho editorial assinatura do projeto
        'red-strong': '#D32F2F',
        graphite: '#111111',
        'gray-editorial': '#555555',
        // ✦ Acentos nostálgicos ✦
        'y2k-pink': '#FF69B4',
        'y2k-babypink': '#FFD1DC',
        'y2k-fuchsia': '#C8102E', // Mantém alinhado ao vermelho editorial
        'y2k-purple': '#8B0000',
        'y2k-cyan': '#A0E7E5',
        'y2k-mint': '#B4F8C8',
        'y2k-yellow': '#FEE440',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'y2k': '4px 4px 0px 0px #111111',
        'y2k-red': '4px 4px 0px 0px #C8102E',
      }
    },
  },
  plugins: [],
}
