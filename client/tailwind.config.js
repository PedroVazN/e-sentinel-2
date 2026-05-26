/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#030712',
          50: '#0a0f1a',
          100: '#0f172a',
          200: '#111827',
          300: '#1e293b',
        },
        corp: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        neon: {
          cyan: '#22d3ee',
          blue: '#38bdf8',
          violet: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'mesh-dark':
          'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(37,99,235,0.18), transparent), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(34,211,238,0.08), transparent), radial-gradient(ellipse 50% 40% at 0% 80%, rgba(167,139,250,0.06), transparent)',
        'gradient-corp': 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
        'gradient-neon': 'linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #a78bfa 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 40px -10px rgba(56,189,248,0.45)',
        'glow-sm': '0 0 20px -5px rgba(37,99,235,0.5)',
        premium: '0 24px 48px -12px rgba(0,0,0,0.5)',
        card: '0 4px 24px -4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
