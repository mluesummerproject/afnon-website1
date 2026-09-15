import type { Config } from 'tailwindcss';

/**
 * Afnon design tokens.
 *
 * Every value the interface uses lives here or in the `:root` block of
 * app/globals.css. Components reference semantic names (`paper`, `ink-muted`,
 * `anor`) — never raw hex.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'paper-alt': 'rgb(var(--paper-alt) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        night: 'rgb(var(--night) / <alpha-value>)',
        'night-soft': 'rgb(var(--night-soft) / <alpha-value>)',

        // Text
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-secondary': 'rgb(var(--ink-secondary) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        'on-night': 'rgb(var(--on-night) / <alpha-value>)',
        'on-night-muted': 'rgb(var(--on-night-muted) / <alpha-value>)',

        // Lines
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        'line-night': 'rgb(var(--line-night) / <alpha-value>)',

        // Accents
        anor: 'rgb(var(--anor) / <alpha-value>)',
        'anor-deep': 'rgb(var(--anor-deep) / <alpha-value>)',
        'anor-light': 'rgb(var(--anor-light) / <alpha-value>)',
        'anor-tint': 'rgb(var(--anor-tint) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        'gold-soft': 'rgb(var(--gold-soft) / <alpha-value>)',

        // Feedback (admin only)
        positive: 'rgb(var(--positive) / <alpha-value>)',
        critical: 'rgb(var(--critical) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial display scale — fluid, set tight, never "just bigger".
        'display-hero': ['clamp(3.1rem, 10.5vw, 9.5rem)', { lineHeight: '0.88', letterSpacing: '-0.025em' }],
        'display-xl': ['clamp(2.6rem, 6.6vw, 5.75rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.1rem, 4.4vw, 3.5rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        'display-md': ['clamp(1.6rem, 2.6vw, 2.25rem)', { lineHeight: '1.12', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.25rem, 1.7vw, 1.5rem)', { lineHeight: '1.2', letterSpacing: '-0.005em' }],

        // Reading + UI
        lead: ['clamp(1.0625rem, 1.15vw, 1.1875rem)', { lineHeight: '1.65' }],
        body: ['0.9375rem', { lineHeight: '1.7' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        micro: ['0.8125rem', { lineHeight: '1.5' }],

        // Tracked-out label — the connective tissue of the whole system
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em' }],
        'label-lg': ['0.75rem', { lineHeight: '1', letterSpacing: '0.16em' }],
      },
      spacing: {
        gutter: 'var(--gutter)',
        'section-y': 'var(--section-y)',
      },
      maxWidth: {
        shell: '108rem',
        measure: '34rem',
        'measure-wide': '44rem',
      },
      borderRadius: {
        // Deliberately sparse: the system is ruled, not rounded.
        none: '0',
        hair: '2px',
        pill: '999px',
        arch: '999px 999px 6px 6px',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'brand-in': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        quick: '180ms',
        base: '320ms',
        slow: '640ms',
      },
      boxShadow: {
        // One shadow only, used for admin overlays. The marketing site uses none.
        panel: '0 18px 48px -24px rgb(var(--ink) / 0.28)',
      },
      keyframes: {
        'fade-rise': {
          from: { opacity: '0', transform: 'translate3d(0, 12px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 640ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
