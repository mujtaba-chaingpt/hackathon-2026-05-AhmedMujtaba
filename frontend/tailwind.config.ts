import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#060608',
        surface: '#0d0d12',
        'surface-2': '#13131a',
        border: '#1e1e2a',
        'border-bright': '#2e2e42',
        foreground: '#ede6d6',
        'foreground-dim': '#a89f8e',
        muted: '#6a6475',
        accent: {
          DEFAULT: '#c9a227',
          hover: '#e0b52a',
          dim: '#c9a22740',
          glow: '#c9a22720',
        },
        danger: {
          DEFAULT: '#9b2226',
          bright: '#c0392b',
          dim: '#9b222620',
        },
        success: {
          DEFAULT: '#1e6b3c',
          bright: '#27ae60',
          dim: '#1e6b3c20',
        },
        gold: '#c9a227',
        crimson: '#9b2226',
        smoke: '#1a1a24',
      },
      fontFamily: {
        // Serif body — Cormorant Garamond, elegant editorial feel for narrative copy
        serif: ['var(--font-serif-body)', 'Cormorant Garamond', 'Georgia', 'Cambria', 'serif'],
        // Sans / UI — Outfit, premium grotesk for buttons and modern UI elements
        sans: ['var(--font-sans)', 'Outfit', 'system-ui', 'sans-serif'],
        // Mono — JetBrains Mono, technical labels and case IDs
        mono: ['var(--font-jetbrains)', '"JetBrains Mono"', '"Courier New"', 'monospace'],
        // Display — Cinzel, dramatic Roman serif for the headline noir feel
        display: ['var(--font-display)', 'Cinzel', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'noir-radial': 'radial-gradient(ellipse at center, #0d0d1a 0%, #060608 70%)',
        'gold-shimmer': 'linear-gradient(135deg, #c9a227 0%, #e0b52a 50%, #a07d15 100%)',
        'crimson-glow': 'radial-gradient(ellipse, rgba(155,34,38,0.3) 0%, transparent 70%)',
        'surface-gradient': 'linear-gradient(180deg, #0d0d12 0%, #060608 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '8%': { opacity: '0.9' },
          '9%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.85' },
          '94%': { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { 'box-shadow': '0 0 20px rgba(201,162,39,0.15)' },
          '50%': { 'box-shadow': '0 0 40px rgba(201,162,39,0.35)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'danger-pulse': {
          '0%, 100%': { color: '#9b2226' },
          '50%': { color: '#c0392b' },
        },
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.4s ease-out',
        typewriter: 'typewriter 2s steps(40) 0.5s forwards',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        flicker: 'flicker 4s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'scan-line': 'scan-line 8s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'danger-pulse': 'danger-pulse 0.8s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      boxShadow: {
        'gold-sm': '0 0 12px rgba(201, 162, 39, 0.2)',
        'gold-md': '0 0 25px rgba(201, 162, 39, 0.3)',
        'gold-lg': '0 0 50px rgba(201, 162, 39, 0.25)',
        'inner-gold': 'inset 0 1px 0 rgba(201, 162, 39, 0.15)',
        'crimson-sm': '0 0 12px rgba(155, 34, 38, 0.3)',
        'inner-bright': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(201, 162, 39, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
