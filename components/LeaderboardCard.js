'use client';

import { Card, Avatar, Typography, Box, Chip, Skeleton } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import { formatStatValue } from '../lib/statsUtils';

/**
 * Format combat power with Chinese units for readability
 * @param {number} value - Combat power value
 * @returns {string} Formatted string
 */
function formatCombatPower(value) {
  if (value === null || value === undefined) return '-';
  return formatStatValue(value);
}

/**
 * Get rank badge color based on position
 * @param {number} rank - Rank position (1-based)
 * @returns {string} Color string
 */
function getRankColor(rank) {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return '#757575'; // Grey
  }
}

/**
 * LeaderboardCard component
 * Displays a single character entry in the leaderboard
 *
 * @param {Object} props
 * @param {number} props.rank - Rank position (1-based)
 * @param {string} props.characterName - Character name
 * @param {number} props.characterLevel - Character level
 * @param {string} props.characterImage - Character avatar URL
 * @param {string} props.worldName - Server name
 * @param {string} props.characterClass - Character class name
 * @param {number} props.combatPower - Combat power value
 * @param {boolean} props.loading - Show loading skeleton
 */
export default function LeaderboardCard({
  rank,
  characterName,
  characterLevel,
  characterImage,
  worldName,
  characterClass,
  combatPower,
  loading = false,
}) {
  if (loading) {
    return (
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          mb: 1,
        }}
      >
        <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
        <Skeleton variant="text" width={80} height={28} />
      </Card>
    );
  }

  const isTopThree = rank <= 3;
  const rankColor = getRankColor(rank);

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        mb: 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        ...(isTopThree && {
          borderLeft: `4px solid ${rankColor}`,
        }),
      }}
    >
      {/* Rank Badge */}
      <Box
        sx={{
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
        }}
      >
        {isTopThree ? (
          <EmojiEventsIcon
            sx={{
              fontSize: 32,
              color: rankColor,
            }}
          />
        ) : (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'text.secondary',
            }}
          >
            {rank}
          </Typography>
        )}
      </Box>

      {/* Character Avatar */}
      <Avatar
        src={characterImage || undefined}
        alt={characterName || 'Character'}
        sx={{
          width: 48,
          height: 48,
          mr: 2,
          border: isTopThree ? `2px solid ${rankColor}` : 'none',
          bgcolor: characterImage ? 'transparent' : 'primary.main',
        }}
      >
        {/* Fallback: show first character of name or PersonIcon */}
        {characterImage ? null : characterName ? (
          characterName.charAt(0)
        ) : (
          <PersonIcon />
        )}
      </Avatar>

      {/* Character Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {characterName || '未知角色'}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {characterLevel && (
            <Chip
              label={`Lv.${characterLevel}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          )}
          {worldName && (
            <Typography variant="caption" color="text.secondary">
              {worldName}
            </Typography>
          )}
          {characterClass && (
            <Typography variant="caption" color="text.secondary">
              • {characterClass}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Combat Power */}
      <Box sx={{ textAlign: 'right', ml: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: isTopThree ? rankColor : 'primary.main',
          }}
        >
          {formatCombatPower(combatPower)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          戰鬥力
        </Typography>
      </Box>
    </Card>
  );
}
