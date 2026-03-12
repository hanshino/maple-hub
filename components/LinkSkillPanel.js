'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const normalizeText = text => text?.replace(/\\r\\n|\\n/g, '\n') ?? '';

/**
 * Detects which preset number matches `character_link_skill` (the active one).
 * Returns 0-based index (0, 1, 2) or 0 as fallback.
 */
function detectActivePresetIndex(data) {
  const current = data.character_link_skill ?? [];
  for (const i of [0, 1, 2]) {
    const preset = data[`character_link_skill_preset_${i + 1}`] ?? [];
    if (preset.length > 0 && preset.length === current.length) {
      const match = current.every(
        (s, j) => preset[j]?.skill_name === s.skill_name
      );
      if (match) return i;
    }
  }
  return 0;
}

const SkillCard = ({ skill }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      transition: 'box-shadow 150ms ease',
      '&:hover': {
        boxShadow: theme =>
          `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
        borderColor: 'primary.light',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        component="img"
        src={skill.skill_icon}
        alt={skill.skill_name}
        sx={{ width: 36, height: 36, flexShrink: 0 }}
        onError={e => {
          e.target.style.display = 'none';
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {skill.skill_name}
          </Typography>
          <Chip
            label={`Lv.${skill.skill_level}`}
            size="small"
            color="primary"
            variant="filled"
            sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
          />
        </Box>
      </Box>
    </Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}
    >
      {normalizeText(skill.skill_effect)}
    </Typography>
  </Box>
);

const OwnedSkillSection = ({ skill }) => {
  if (!skill) return null;
  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            mb: 1,
            display: 'block',
          }}
        >
          本角色提供的傳授技能
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box
            component="img"
            src={skill.skill_icon}
            alt={skill.skill_name}
            sx={{ width: 36, height: 36, flexShrink: 0, mt: 0.25 }}
            onError={e => {
              e.target.style.display = 'none';
            }}
          />
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {skill.skill_name}
              </Typography>
              <Chip
                label={`Lv.${skill.skill_level}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}
            >
              {normalizeText(skill.skill_effect)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const LinkSkillPanel = ({ loading, error, data, onRetry }) => {
  const [presetIndex, setPresetIndex] = useState(() =>
    data ? detectActivePresetIndex(data) : 0
  );

  if (loading) return <PanelSkeleton rows={4} />;
  if (error)
    return <PanelError message="無法載入傳授技能資料" onRetry={onRetry} />;
  if (!data) return <PanelEmpty message="尚無傳授技能資料" />;

  const presets = [
    data.character_link_skill_preset_1 ?? [],
    data.character_link_skill_preset_2 ?? [],
    data.character_link_skill_preset_3 ?? [],
  ];

  const activePresetIndex = detectActivePresetIndex(data);
  const currentSkills = presets[presetIndex] ?? [];
  const ownedSkill = data.character_owned_link_skill ?? null;

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="各預設組合的傳授技能配置" />

      <ToggleButtonGroup
        value={presetIndex}
        exclusive
        onChange={(_, v) => v !== null && setPresetIndex(v)}
        size="small"
        sx={{ mb: 2 }}
        aria-label="傳授技能預設選擇"
      >
        {[0, 1, 2].map(i => (
          <ToggleButton
            key={i}
            value={i}
            sx={{ px: 2, borderRadius: '20px !important', gap: 0.5 }}
          >
            預設 {i + 1}
            {i === activePresetIndex && (
              <Chip
                label="使用中"
                size="small"
                color="primary"
                sx={{ height: 16, fontSize: '0.6rem', ml: 0.5 }}
              />
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {currentSkills.length === 0 ? (
        <PanelEmpty message="此預設尚未設定傳授技能" />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {currentSkills.map((skill, i) => (
            <SkillCard key={i} skill={skill} />
          ))}
        </Box>
      )}

      <OwnedSkillSection skill={ownedSkill} />
    </Box>
  );
};

export default LinkSkillPanel;
