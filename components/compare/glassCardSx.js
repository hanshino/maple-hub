import { alpha } from '@mui/material/styles';

// Shared glass-card container style for the /compare feature, matching
// app/about/page.js's glassCardSx visual language: translucent blur card
// with an orange-tinted border. Hover uses translateY + shadow, never
// scale, per the project's design-system rule.
export const glassCardSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor: theme =>
    alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.22 : 0.18
    ),
  bgcolor: theme =>
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha('#ffffff', 0.7),
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme =>
      theme.palette.mode === 'dark'
        ? '0 10px 28px rgba(0,0,0,0.35)'
        : '0 10px 28px rgba(168,106,20,0.14)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': { transform: 'none' },
  },
};

// A non-interactive variant (no hover lift) for cards that shouldn't read
// as clickable, e.g. the data-quality notice.
export const staticGlassCardSx = {
  ...glassCardSx,
  '&:hover': {},
};
