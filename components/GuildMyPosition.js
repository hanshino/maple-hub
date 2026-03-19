'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Avatar,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

const LS_KEY = 'maple:guild:myCharacter';

export default function GuildMyPosition({ members }) {
  const { mode } = useColorMode();
  const [myName, setMyName] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) || '';
    } catch {
      return '';
    }
  });
  const syncedMembers = useMemo(
    () => members.filter(m => m.characterLevel),
    [members]
  );

  const handleChange = (_, val) => {
    const name = val || '';
    setMyName(name);
    try {
      if (name) {
        localStorage.setItem(LS_KEY, name);
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  const memberNames = useMemo(
    () => syncedMembers.map(m => m.characterName),
    [syncedMembers]
  );

  const selectedMember = useMemo(
    () => syncedMembers.find(m => m.characterName === myName),
    [myName, syncedMembers]
  );

  const position = useMemo(() => {
    if (!myName || !selectedMember) return null;

    const byLevel = [...syncedMembers].sort(
      (a, b) => (b.characterLevel || 0) - (a.characterLevel || 0)
    );
    const byCombat = [...syncedMembers].sort(
      (a, b) => (b.combatPower || 0) - (a.combatPower || 0)
    );

    const levelRank = byLevel.findIndex(m => m.characterName === myName) + 1;
    const combatRank = byCombat.findIndex(m => m.characterName === myName) + 1;
    const total = syncedMembers.length;

    return {
      levelRank,
      combatRank,
      total,
      levelPR: Math.round(((total - levelRank) / total) * 100),
      combatPR: Math.round(((total - combatRank) / total) * 100),
      ahead: combatRank - 1,
      behind: total - combatRank,
    };
  }, [myName, selectedMember, syncedMembers]);

  const glassCardSx = { ...getGlassCardSx(mode), p: 3, mb: 3 };

  const outlinedChipBorder =
    mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(247,147,30,0.3)';

  return (
    <Box sx={glassCardSx}>
      <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 700 }}>
        我的位置
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Autocomplete
          options={memberNames}
          value={myName || null}
          onChange={handleChange}
          renderInput={params => (
            <TextField {...params} label="選擇你的角色" size="small" />
          )}
          sx={{ maxWidth: 300, flex: 1 }}
        />
        {selectedMember?.characterImage && (
          <Avatar
            src={selectedMember.characterImage}
            alt={selectedMember.characterName}
            sx={{ width: 48, height: 48 }}
          />
        )}
      </Box>

      {!myName && (
        <Typography variant="body2" color="text.secondary">
          選擇你的角色來查看你在工會中的位置
        </Typography>
      )}

      {myName && !position && (
        <Typography variant="body2" color="text.secondary">
          你的角色不在此工會中，或資料尚在同步中
        </Typography>
      )}

      {position && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
          <Chip
            icon={<EmojiEventsIcon />}
            label={`戰力排名 第 ${position.combatRank}/${position.total} 名`}
            color="warning"
            sx={{ px: 1.5 }}
          />
          <Chip
            icon={<TrendingUpIcon />}
            label={`等級排名 第 ${position.levelRank}/${position.total} 名`}
            sx={{ px: 1.5 }}
          />
          <Chip
            icon={<SpeedIcon />}
            label={`戰力 PR ${position.combatPR}`}
            variant="outlined"
            sx={{ px: 1.5, borderColor: outlinedChipBorder }}
          />
          <Chip
            icon={<PeopleAltIcon />}
            label={`前方 ${position.ahead} 人 · 後方 ${position.behind} 人`}
            variant="outlined"
            sx={{ px: 1.5, borderColor: outlinedChipBorder }}
          />
        </Box>
      )}
    </Box>
  );
}
