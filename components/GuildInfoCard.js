'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Collapse,
  IconButton,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';

export default function GuildInfoCard({ guild }) {
  const { mode } = useColorMode();
  const [skillsOpen, setSkillsOpen] = useState(false);

  const hasSkills =
    guild.skills?.regular?.length > 0 || guild.skills?.noblesse?.length > 0;

  const glassCardSx = { ...getGlassCardSx(mode, { hover: true }), p: 3, mb: 3 };

  return (
    <Box sx={glassCardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {guild.guildMarkCustom ? (
          <Avatar
            src={`data:image/png;base64,${guild.guildMarkCustom}`}
            alt={`${guild.guildName} guild mark`}
            sx={{ width: 48, height: 48 }}
          />
        ) : (
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              color: '#fff',
            }}
          >
            {guild.guildName?.[0] || '?'}
          </Avatar>
        )}
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            {guild.guildName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {guild.worldName}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          icon={<StarIcon />}
          label={`Lv.${guild.guildLevel}`}
          sx={{ px: 1.5 }}
        />
        <Chip
          icon={<GroupsIcon />}
          label={`${guild.guildMemberCount} 人`}
          sx={{ px: 1.5 }}
        />
        <Chip
          icon={<EmojiEventsIcon />}
          label={`名聲 ${guild.guildFame}`}
          sx={{ px: 1.5 }}
        />
        <Chip label={`會長: ${guild.guildMasterName}`} sx={{ px: 1.5 }} />
      </Box>

      {hasSkills && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setSkillsOpen(!skillsOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSkillsOpen(!skillsOpen);
              }
            }}
            aria-expanded={skillsOpen}
            aria-label="展開工會技能"
          >
            <AutoFixHighIcon
              sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: 'text.secondary' }}
            >
              工會技能
            </Typography>
            <IconButton size="small" tabIndex={-1}>
              <ExpandMoreIcon
                sx={{
                  transform: skillsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </IconButton>
          </Box>
          <Collapse in={skillsOpen}>
            <Box sx={{ mt: 1 }}>
              {guild.skills?.regular?.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    一般技能
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {guild.skills.regular.map(skill => (
                      <Chip
                        key={skill.skillName}
                        label={`${skill.skillName} Lv.${skill.skillLevel}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          px: 1.5,
                          borderColor:
                            mode === 'dark'
                              ? 'rgba(255,255,255,0.15)'
                              : 'rgba(247,147,30,0.3)',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {guild.skills?.noblesse?.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    貴族技能
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {guild.skills.noblesse.map(skill => (
                      <Chip
                        key={skill.skillName}
                        label={`${skill.skillName} Lv.${skill.skillLevel}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          px: 1.5,
                          borderColor:
                            mode === 'dark'
                              ? 'rgba(255,255,255,0.15)'
                              : 'rgba(247,147,30,0.3)',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
