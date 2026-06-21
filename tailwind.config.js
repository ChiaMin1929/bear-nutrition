/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF7',
        coral: '#F4845F',
        teal: '#7EC8C8',
        yellow: '#F5D76E',
        purple: '#C9B8E8',
        mint: '#A8D8B0',
        text: '#3D3530',
        card: '#FFFFFF',
        border: '#E8E4DF',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '20px',
        '2xl': '28px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
}
