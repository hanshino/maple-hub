/**
 * Shared glassmorphism card style generator.
 * Used across guild components and about page.
 * @param {string} mode - 'light' or 'dark'
 * @param {{ hover?: boolean }} options
 */
export function getGlassCardSx(mode, { hover = false } = {}) {
  const sx = {
    borderRadius: 3,
    border: '1px solid',
    borderColor:
      mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(247,147,30,0.15)',
    bgcolor: mode === 'dark' ? 'rgba(42,31,26,0.6)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
  };

  if (hover) {
    sx.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    sx['&:hover'] = {
      transform: 'translateY(-2px)',
      boxShadow:
        mode === 'dark'
          ? '0 8px 24px rgba(0,0,0,0.3)'
          : '0 8px 24px rgba(247,147,30,0.12)',
    };
    sx['@media (prefers-reduced-motion: reduce)'] = {
      '&:hover': { transform: 'none' },
    };
  }

  return sx;
}
