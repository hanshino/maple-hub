'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import Link from 'next/link';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';
import { track } from '@/lib/analytics';

const RANK_COLORS = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

function formatGrowth(value) {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function growthTooltip(value) {
  if (value == null) return '尚無資料';
  const levels = Math.floor(Math.abs(value) / 100);
  const remainder = Math.abs(value) % 100;
  if (levels === 0) {
    return `經驗成長 ${value >= 0 ? '+' : '-'}${remainder.toFixed(2)}%`;
  }
  return `升了 ${levels} 級又 ${remainder.toFixed(2)}% 經驗`;
}

function GrowthChip({ value, mode }) {
  const isPositive = value > 0;
  const noData = value == null;

  return (
    <Tooltip title={growthTooltip(value)} arrow placement="top">
      <Chip
        label={formatGrowth(value)}
        size="small"
        variant={noData ? 'outlined' : 'filled'}
        sx={{
          px: 1.5,
          minWidth: 96,
          ...(isPositive && {
            bgcolor: '#f7931e',
            color: '#fff',
          }),
          ...(noData && {
            borderStyle: 'dashed',
            borderColor:
              mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          }),
          ...(value != null &&
            value === 0 && {
              bgcolor:
                mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }),
        }}
      />
    </Tooltip>
  );
}

export default function GuildMemberTable({ members }) {
  const { mode } = useColorMode();
  const [orderBy, setOrderBy] = useState('combatPower');
  const [order, setOrder] = useState('desc');
  const [search, setSearch] = useState('');

  const sortedMembers = useMemo(() => {
    const filtered = members.filter(m =>
      m.characterName.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      // Push null/undefined values to the end regardless of sort direction
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [members, orderBy, order, search]);

  const handleSort = field => {
    let newOrder;
    if (orderBy === field) {
      newOrder = order === 'desc' ? 'asc' : 'desc';
      setOrder(newOrder);
    } else {
      // Effort ranks default to ascending (#1 first), others descending
      newOrder = field.startsWith('effortRank') ? 'asc' : 'desc';
      setOrderBy(field);
      setOrder(newOrder);
    }
    track('guild_sort', { sortBy: field, order: newOrder });
  };

  const hasGrowthData = members.some(
    m => m.growth7 != null || m.growth30 != null
  );

  const glassCardSx = { ...getGlassCardSx(mode), p: 3, mb: 3 };

  return (
    <Box sx={glassCardSx}>
      <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 700 }}>
        成員
      </Typography>

      <TextField
        size="small"
        placeholder="搜尋成員..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2, width: '100%', maxWidth: 300 }}
      />

      {sortedMembers.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 4, textAlign: 'center' }}
        >
          {search ? '找不到符合的成員' : '尚無成員資料，請等待同步完成'}
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>職業</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'characterLevel'}
                    direction={orderBy === 'characterLevel' ? order : 'desc'}
                    onClick={() => handleSort('characterLevel')}
                  >
                    等級
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'combatPower'}
                    direction={orderBy === 'combatPower' ? order : 'desc'}
                    onClick={() => handleSort('combatPower')}
                  >
                    戰力
                  </TableSortLabel>
                </TableCell>
                {hasGrowthData && (
                  <>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'growth7'}
                        direction={orderBy === 'growth7' ? order : 'desc'}
                        onClick={() => handleSort('growth7')}
                      >
                        7 天成長
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'growth30'}
                        direction={orderBy === 'growth30' ? order : 'desc'}
                        onClick={() => handleSort('growth30')}
                      >
                        30 天成長
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title="依等級加權的努力排名，等級越高同樣經驗成長的權重越大"
                        arrow
                        placement="top"
                      >
                        <TableSortLabel
                          active={orderBy === 'effortRank7'}
                          direction={orderBy === 'effortRank7' ? order : 'asc'}
                          onClick={() => handleSort('effortRank7')}
                        >
                          7 天努力
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title="依等級加權的努力排名，等級越高同樣經驗成長的權重越大"
                        arrow
                        placement="top"
                      >
                        <TableSortLabel
                          active={orderBy === 'effortRank30'}
                          direction={orderBy === 'effortRank30' ? order : 'asc'}
                          onClick={() => handleSort('effortRank30')}
                        >
                          30 天努力
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMembers.map((member, idx) => {
                const rank = idx + 1;
                const rankColor = RANK_COLORS[rank];
                const isTopThree = rank <= 3;

                return (
                  <TableRow
                    key={member.id || member.characterName}
                    sx={{
                      transition: 'background-color 0.15s ease',
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                      },
                      '&:hover': {
                        bgcolor:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.04)',
                      },
                      ...(isTopThree && {
                        borderLeft: `4px solid ${rankColor}`,
                      }),
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isTopThree ? 700 : 400,
                          color: rankColor || 'text.secondary',
                        }}
                      >
                        {rank}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          src={member.characterImage || undefined}
                          alt={member.characterName}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: member.characterImage
                              ? 'transparent'
                              : 'primary.main',
                            ...(isTopThree && {
                              border: `2px solid ${rankColor}`,
                            }),
                          }}
                        >
                          {!member.characterImage &&
                            (member.characterName?.[0] || '?')}
                        </Avatar>
                        <Link
                          href={`/character/${encodeURIComponent(member.characterName)}`}
                          style={{
                            color: 'inherit',
                            textDecoration: 'none',
                          }}
                          onClick={() =>
                            track('guild_member_click', {
                              memberName: member.characterName,
                            })
                          }
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              '&:hover': {
                                color: 'primary.main',
                              },
                            }}
                          >
                            {member.characterName}
                          </Typography>
                        </Link>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {member.characterClass || (
                        <Chip
                          icon={<SyncIcon sx={{ fontSize: 14 }} />}
                          label="同步中..."
                          size="small"
                          variant="outlined"
                          sx={{
                            px: 1.5,
                            height: 24,
                            fontSize: '0.7rem',
                            borderColor:
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.15)'
                                : 'rgba(0,0,0,0.12)',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {member.characterLevel ?? (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.combatPower ? (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isTopThree ? 700 : 400,
                            color: isTopThree ? rankColor : 'text.primary',
                          }}
                        >
                          {Number(member.combatPower).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    {hasGrowthData && (
                      <>
                        <TableCell>
                          <GrowthChip value={member.growth7} mode={mode} />
                        </TableCell>
                        <TableCell>
                          <GrowthChip value={member.growth30} mode={mode} />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              member.effortRank7 != null
                                ? 'text.primary'
                                : 'text.disabled'
                            }
                            sx={{
                              fontWeight: member.effortRank7 <= 3 ? 700 : 400,
                            }}
                          >
                            {member.effortRank7 != null
                              ? `#${member.effortRank7}`
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              member.effortRank30 != null
                                ? 'text.primary'
                                : 'text.disabled'
                            }
                            sx={{
                              fontWeight: member.effortRank30 <= 3 ? 700 : 400,
                            }}
                          >
                            {member.effortRank30 != null
                              ? `#${member.effortRank30}`
                              : '—'}
                          </Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
