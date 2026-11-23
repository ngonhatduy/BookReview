/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          bg: '#261f1b',
          surface: '#342b26',
          hover: '#3d332d',
          border: '#473c35',
          input: '#2c2420',
        },
        parchment: {
          primary: '#efe6dc',
          secondary: '#b5a698',
          muted: '#8b7c6f',
        },
        gold: {
          star: '#e2b866',
          empty: '#66584e',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
