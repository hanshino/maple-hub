'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useColorMode } from './MuiThemeProvider';
import { getGlassCardSx } from '@/lib/theme';
import { track } from '@/lib/analytics';

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
            <GroupsIcon sx={{ fontSize: 28 }} />
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
        <Chip
          icon={<PersonIcon />}
          label={`會長: ${guild.guildMasterName}`}
          sx={{ px: 1.5 }}
        />
      </Box>

      {hasSkills && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (!skillsOpen)
                track('guild_skill_expand', { guildName: guild.guildName });
              setSkillsOpen(!skillsOpen);
            }}
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
                <Box sx={{ mb: 1.5 }}>
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {guild.skills.regular.map(skill => (
                      <Tooltip
                        key={skill.skillName}
                        title={
                          <Box sx={{ textAlign: 'center', p: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {skill.skillName} Lv.{skill.skillLevel}
                            </Typography>
                            {skill.skillEffect && (
                              <Typography
                                variant="caption"
                                sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}
                              >
                                {skill.skillEffect}
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor:
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(247,147,30,0.25)',
                            bgcolor:
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(247,147,30,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition:
                              'transform 0.15s ease, box-shadow 0.15s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow:
                                mode === 'dark'
                                  ? '0 4px 12px rgba(0,0,0,0.3)'
                                  : '0 4px 12px rgba(247,147,30,0.15)',
                            },
                          }}
                        >
                          {skill.skillIcon ? (
                            <Avatar
                              src={skill.skillIcon}
                              alt={skill.skillName}
                              variant="square"
                              sx={{ width: 32, height: 32 }}
                            />
                          ) : (
                            <AutoFixHighIcon
                              sx={{ fontSize: 20, color: 'text.secondary' }}
                            />
                          )}
                        </Box>
                      </Tooltip>
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {guild.skills.noblesse.map(skill => (
                      <Tooltip
                        key={skill.skillName}
                        title={
                          <Box sx={{ textAlign: 'center', p: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {skill.skillName} Lv.{skill.skillLevel}
                            </Typography>
                            {skill.skillEffect && (
                              <Typography
                                variant="caption"
                                sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}
                              >
                                {skill.skillEffect}
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor:
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(247,147,30,0.25)',
                            bgcolor:
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(247,147,30,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition:
                              'transform 0.15s ease, box-shadow 0.15s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow:
                                mode === 'dark'
                                  ? '0 4px 12px rgba(0,0,0,0.3)'
                                  : '0 4px 12px rgba(247,147,30,0.15)',
                            },
                          }}
                        >
                          {skill.skillIcon ? (
                            <Avatar
                              src={skill.skillIcon}
                              alt={skill.skillName}
                              variant="square"
                              sx={{ width: 32, height: 32 }}
                            />
                          ) : (
                            <AutoFixHighIcon
                              sx={{ fontSize: 20, color: 'text.secondary' }}
                            />
                          )}
                        </Box>
                      </Tooltip>
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
