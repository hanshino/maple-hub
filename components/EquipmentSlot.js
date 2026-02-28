'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const gridSx = (item, selected) => ({
  width: 80,
  height: 80,
  p: 0.5,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  cursor: item ? 'pointer' : 'default',
  transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
  backgroundColor: selected
    ? (theme) => alpha(theme.palette.primary.main, 0.08)
    : item
      ? 'background.paper'
      : 'background.default',
  border: selected
    ? (theme) => `2px solid ${theme.palette.primary.main}`
    : item
      ? (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`
      : (theme) =>
          theme.palette.mode === 'dark'
            ? '2px dashed #5a4a38'
            : '2px dashed #e0c9a8',
  boxShadow: item
    ? (theme) =>
        `inset -1px -1px 4px rgba(0,0,0,0.05), 2px 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
    : 'none',
  '&:hover': item
    ? {
        transform: 'translateY(-2px)',
        boxShadow: (theme) =>
          `inset -1px -1px 4px rgba(0,0,0,0.05), 4px 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
      }
    : {},
  '&:focus-visible': {
    outline: (theme) => `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': { transform: 'none' },
  },
});

const listSx = (item, selected) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  py: 1,
  minHeight: 64,
  cursor: item ? 'pointer' : 'default',
  borderLeft: selected
    ? (theme) => `3px solid ${theme.palette.primary.main}`
    : '3px solid transparent',
  backgroundColor: selected
    ? (theme) => alpha(theme.palette.primary.main, 0.08)
    : 'transparent',
  transition: 'background-color 200ms ease-out',
  '&:hover': item
    ? {
        backgroundColor: (theme) =>
          alpha(theme.palette.primary.main, 0.04),
      }
    : {},
  '&:focus-visible': {
    outline: (theme) => `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '-2px',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
});

const EquipmentSlot = ({
  item,
  slotKey,
  slotName,
  variant = 'grid',
  selected = false,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const isGrid = variant === 'grid';
  const ariaLabel = item
    ? `${slotName}：${item.item_name}`
    : `${slotName}：空`;

  const handleClick = () => {
    if (onClick) onClick(slotKey);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  if (isGrid) {
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        sx={gridSx(item, selected)}
      >
        {item && item.item_icon && !imageError ? (
          <img
            src={item.item_icon}
            alt={item.item_name}
            style={{
              width: 40,
              height: 40,
              objectFit: 'contain',
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Box sx={{ width: 40, height: 40 }} />
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            lineHeight: 1.2,
            textAlign: 'center',
            mt: 0.25,
          }}
        >
          {slotName}
        </Typography>
      </Box>
    );
  }

  // List variant
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={listSx(item, selected)}
    >
      {item && item.item_icon && !imageError ? (
        <img
          src={item.item_icon}
          alt={item.item_name}
          style={{
            width: 40,
            height: 40,
            objectFit: 'contain',
            flexShrink: 0,
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '8px',
            backgroundColor: 'background.paper',
            border: (theme) =>
              theme.palette.mode === 'dark'
                ? '1px dashed #5a4a38'
                : '1px dashed #e0c9a8',
          }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: item ? 600 : 400,
            color: item ? 'text.primary' : 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item ? item.item_name : slotName}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary' }}
        >
          {slotName}
        </Typography>
      </Box>
      {item && (
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          {item.starforce && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700 }}
            >
              {item.starforce}
            </Typography>
          )}
          {item.item_level && (
            <Typography
              variant="caption"
              display="block"
              sx={{ color: 'text.secondary' }}
            >
              Lv. {item.item_level}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EquipmentSlot;
