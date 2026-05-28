/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1A1A2E',
        accent: '#2E75B6'
      }
    }
  },
  plugins: []
};
