export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        brand: 'var(--brand)',
        'brand-strong': 'var(--brand-strong)',
        success: '#1a7f37',
        error: '#cf222e',
        warning: '#9a6700',
        info: '#0969da',
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        'surface-elevated': 'var(--c-surface-elevated)',
        border: 'var(--c-border)',
        content: 'var(--c-text)',
        muted: 'var(--c-text-muted)',
      },
    },
  },
  plugins: [],
};
