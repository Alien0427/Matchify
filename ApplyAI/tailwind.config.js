/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#121212',
        surfaceAlt: '#1a1a1a',
        textPrimary: '#FFFFFF',
        textSecondary: '#CCCCCC',
        accent: '#8B5CF6',
        accentHover: '#A78BFA',
        danger: '#FF5555',
      },
      boxShadow: {
        'neon': '0 0 8px #8B5CF6, 0 0 16px #8B5CF6',
        'neon-hover': '0 0 16px #A78BFA, 0 0 32px #A78BFA',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'border-glow': '0 0 0 1px rgba(139, 92, 246, 0.2)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 60s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 8px #8B5CF6, 0 0 16px #8B5CF6' },
          '100%': { boxShadow: '0 0 16px #A78BFA, 0 0 32px #A78BFA' },
        },
      },
      transitionDelay: {
        '1000': '1000ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
    },
  },
  plugins: [],
};
