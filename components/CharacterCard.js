import { memo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CardContent,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import GroupsIcon from '@mui/icons-material/Groups';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import DiamondIcon from '@mui/icons-material/Diamond';

const COMBO_LABELS = [
  { key: 'equip', label: '裝備' },
  { key: 'hyperStat', label: '極限屬性' },
  { key: 'linkSkill', label: '傳授技能' },
];

const PresetCombinationTable = ({ combinations }) => {
  if (!combinations) return null;

  const scenarios = [
    { key: 'live', label: '目前' },
    { key: 'boss', label: '打王' },
    ...(combinations.exp ? [{ key: 'exp', label: '練等' }] : []),
  ];

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 0.5 }}
      >
        Preset 組合
      </Typography>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th, & td': {
            px: 0.75,
            py: 0.25,
            fontSize: '0.7rem',
            textAlign: 'center',
          },
          '& th': { color: 'text.secondary', fontWeight: 600 },
        }}
      >
        <thead>
          <tr>
            <th></th>
            {scenarios.map(s => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMBO_LABELS.map(({ key, label }) => (
            <tr key={key}>
              <Box component="td" sx={{ textAlign: 'left !important' }}>
                {label}
              </Box>
              {scenarios.map(s => (
                <td key={s.key}>
                  {combinations[s.key]?.[key] != null
                    ? combinations[s.key][key]
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
};

const CharacterCard = memo(function CharacterCard({
  character,
  unionData = null,
  battlePower = null,
  onEquipmentClick = null,
  presetAnalysis = null,
}) {
  const formatPower = num => num?.toLocaleString() || '-';

  return (
    <CardContent
      role="region"
      aria-labelledby={`character-${character.ocid || character.character_name}`}
      sx={{ p: 3 }}
    >
      {/* Hero layout: horizontal on desktop, vertical on mobile */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Avatar - larger for hero style */}
        {character.character_image && (
          <Avatar
            src={character.character_image}
            alt={`${character.character_name} 角色頭像`}
            sx={{
              width: { xs: 80, md: 96 },
              height: { xs: 80, md: 96 },
              flexShrink: 0,
            }}
          />
        )}

        {/* Character info - middle section */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          {/* Name + Server + Level */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'baseline' },
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              id={`character-${character.ocid || character.character_name}`}
              variant="h5"
              component="h3"
              sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}
            >
              {character.character_name}
            </Typography>
            <Chip
              label={`Lv.${character.character_level}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {character.world_name}
            </Typography>
          </Box>

          {/* Stats row: class, guild, union as Chips */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: { xs: 'center', md: 'flex-start' },
              mb: 1.5,
            }}
          >
            <Chip
              icon={<WorkIcon />}
              label={`${character.character_class} ${character.character_class_level}`}
              size="small"
              variant="outlined"
              sx={{ px: 1 }}
            />
            {character.character_guild_name && (
              <Chip
                icon={<GroupsIcon />}
                label={character.character_guild_name}
                size="small"
                variant="outlined"
                sx={{ px: 1 }}
              />
            )}
            {unionData && (
              <>
                <Chip
                  icon={<MilitaryTechIcon />}
                  label={`${unionData.union_grade} Lv.${unionData.union_level}`}
                  size="small"
                  variant="outlined"
                  sx={{ px: 1 }}
                />
                <Chip
                  icon={<DiamondIcon />}
                  label={`神器 Lv.${unionData.union_artifact_level}`}
                  size="small"
                  variant="outlined"
                  sx={{ px: 1 }}
                />
              </>
            )}
          </Box>

          {/* Action buttons + timestamp */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            {onEquipmentClick && (
              <Button
                variant="outlined"
                size="small"
                onClick={onEquipmentClick}
                sx={{ fontWeight: 'medium' }}
              >
                裝備
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              最後更新:{' '}
              {character.date
                ? new Date(character.date).toLocaleString()
                : new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Battle Power - right section */}
        {(presetAnalysis || battlePower) && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' } }}
            />
            <Box
              sx={{
                textAlign: { xs: 'center', md: 'right' },
                flexShrink: 0,
                px: { md: 1 },
                minWidth: { md: 160 },
                minHeight: { md: 80 },
              }}
            >
              {presetAnalysis && presetAnalysis.bossing ? (
                <>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    戰鬥力
                  </Typography>
                  {[
                    { label: '打王', data: presetAnalysis.bossing },
                    { label: '目前', data: presetAnalysis.current },
                    ...(presetAnalysis.leveling
                      ? [{ label: '練等', data: presetAnalysis.leveling }]
                      : []),
                  ].map(({ label, data }) => (
                    <Box
                      key={label}
                      sx={{
                        display: 'flex',
                        justifyContent: { xs: 'center', md: 'space-between' },
                        alignItems: 'baseline',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 'bold',
                          color:
                            label === '打王' ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {formatPower(data.power)}
                      </Typography>
                      {data.presetNo && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.primary', opacity: 0.7 }}
                        >
                          P{data.presetNo}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  <PresetCombinationTable
                    combinations={presetAnalysis.presetCombinations}
                  />
                </>
              ) : (
                <>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    戰鬥力
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    {battlePower?.toLocaleString()}
                  </Typography>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </CardContent>
  );
});

export default CharacterCard;
