/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ededed",
        primary: {
          DEFAULT: "#3b82f6", // Blue-500
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#8b5cf6", // Violet-500
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#10b981", // Emerald-500
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#171717",
          foreground: "#ededed",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
