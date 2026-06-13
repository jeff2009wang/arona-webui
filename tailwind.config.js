/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 8px 32px rgba(53,156,215,0.10)',
        'soft-strong': '0 8px 32px rgba(53,156,215,0.16)',
      },
    },
  },
  plugins: [],
}
