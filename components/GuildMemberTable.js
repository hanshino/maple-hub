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
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import Link from 'next/link';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

const RANK_COLORS = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

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
      const aVal = a[orderBy] ?? -1;
      const bVal = b[orderBy] ?? -1;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [members, orderBy, order, search]);

  const handleSort = field => {
    if (orderBy === field) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setOrderBy(field);
      setOrder('desc');
    }
  };

  const glassCardSx = { ...getGlassCardSx(mode), p: 3, mb: 3 };

  return (
    <Box sx={glassCardSx}>
      <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 700 }}>
        成員排行
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
        <TableContainer>
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
