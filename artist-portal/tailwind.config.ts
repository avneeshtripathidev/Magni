import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Admin Portal primary accent (Sky / Blue)
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        coral: {
          DEFAULT: '#0284C7',
          hover: '#0369A1',
          muted: 'rgba(2, 132, 199, 0.10)',
        },
        marigold: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          muted: 'rgba(245, 158, 11, 0.10)',
        },
        gold: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          muted: 'rgba(245, 158, 11, 0.10)',
        },
        charcoal: {
          DEFAULT: '#0F172A',
          surface: '#1E293B',
          base: '#0F172A',
        },
        ivory: {
          DEFAULT: '#0F172A',
        },
        wine: {
          DEFAULT: '#4F46E5',
          muted: 'rgba(79, 70, 229, 0.10)',
        },
        stone: {
          DEFAULT: '#64748B',
          muted: '#94A3B8',
        },
        // Complete Admin Portal Theme Tokens
        brand: {
          base: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F1F5F9',
          border: '#E2E8F0',
          borderHover: '#CBD5E1',
          coral: '#0284C7',
          marigold: '#F59E0B',
          gold: '#F59E0B',
          charcoal: '#0F172A',
          ivory: '#0F172A',
          stone: '#64748B',
          wine: '#4F46E5',
          muted: '#64748B',
          dim: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
        card: '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        panel: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
