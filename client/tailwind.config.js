/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17202a',
        field: '#f6f7f9',
        line: '#d9dee7',
        brand: '#0f766e',
        accent: '#b45309'
      }
    }
  },
  plugins: []
};
