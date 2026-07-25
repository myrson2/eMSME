/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary — Philippine Blue (desaturated, saturation < 80%)
        primary: '#1B4FDB',
        'primary-dark': '#143BB0',
        'primary-muted': '#E8ECF8',
        'primary-subtle': '#F2F4FC',

        // Signal — destructive / required markers
        signal: '#C9372C',
        'signal-muted': '#FDECEA',

        // Amber — warnings / secondary
        amber: '#C4882E',
        'amber-muted': '#FDF3E4',

        // Gold — Philippine flag only (sparingly)
        gold: '#F5C842',

        // Surfaces — warm off-whites
        surface: '#F8F9FB',
        'surface-raised': '#FFFFFF',

        // Text hierarchy
        ink: '#161618',
        body: '#545459',
        caption: '#8A8A8F',
        placeholder: '#B0B0B6',

        // Structural
        border: '#E4E4E7',
        'border-subtle': '#F0F0F2',
        divider: '#EBEBEE',
      },
      fontFamily: {
        // Display / Headers — Plus Jakarta Sans
        display: ['PlusJakartaSans_700Bold', 'sans-serif'],
        heading: ['PlusJakartaSans_600SemiBold', 'sans-serif'],
        medium: ['PlusJakartaSans_500Medium', 'sans-serif'],
        sans: ['PlusJakartaSans_400Regular', 'sans-serif'],
        // Monospace — numerals, currencies, IDs, codes
        mono: ['JetBrainsMono_400Regular', 'monospace'],
        'mono-medium': ['JetBrainsMono_500Medium', 'monospace'],
      },
      borderRadius: {
        // Concentric system — outer containers always larger than inner elements
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      fontSize: {
        // Explicit scale to match theme.ts
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '22px' }],
        md: ['15px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['22px', { lineHeight: '30px' }],
        '2xl': ['28px', { lineHeight: '36px' }],
      },
    },
  },
  plugins: [],
}
