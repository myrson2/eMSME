/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1740DE',
        'primary-dark': '#0F39D2',
        signal: '#E63B27',
        amber: '#D99C45',
        lavender: '#EFF1FD',
        surface: '#FFFFFF',
        ink: '#1A1A1A',
        body: '#4A4A4A',
        border: '#E2E5F0',
      },
      fontFamily: {
        display: ['Poppins_700Bold', 'sans-serif'],
        displaySemi: ['Poppins_600SemiBold', 'sans-serif'],
        sans: ['Inter_400Regular', 'sans-serif'],
        medium: ['Inter_500Medium', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
        md: '12px',
        lg: '18px',
        full: '9999px',
      }
    },
  },
  plugins: [],
}
