import { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Avatar,
  CardContent,
  Button,
  Chip,
  Snackbar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import WorkIcon from '@mui/icons-material/Work';
import GroupsIcon from '@mui/icons-material/Groups';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import DiamondIcon from '@mui/icons-material/Diamond';
import ShieldIcon from '@mui/icons-material/Shield';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShareIcon from '@mui/icons-material/Share';

const ICON_SIZE = 16;
const TABLE_FONT_SIZE = '0.65rem';

const COMBO_LABELS = [
  { key: 'equip', label: '裝備' },
  { key: 'hyperStat', label: '極限屬性' },
  { key: 'linkSkill', label: '傳授技能' },
];

const formatTimestamp = dateStr => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const formatPower = num => num?.toLocaleString() || '-';

/** Battle power row for multi-preset display */
const PowerRow = ({ label, data, isHighlight }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 1,
      py: 0.25,
    }}
  >
    <Typography
      variant="caption"
      sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 28 }}
    >
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{
        fontWeight: 700,
        fontFamily: '"Comic Neue", cursive',
        color: isHighlight ? 'primary.main' : 'text.primary',
        userSelect: 'all',
        lineHeight: 1.3,
      }}
    >
      {formatPower(data.power)}
    </Typography>
    {data.presetNo && (
      <Chip
        label={`P${data.presetNo}`}
        size="small"
        sx={{
          height: 18,
          fontSize: TABLE_FONT_SIZE,
          fontWeight: 600,
          bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
          color: 'text.secondary',
        }}
      />
    )}
  </Box>
);

/** Preset combination mini-table */
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
        sx={{
          display: 'block',
          mb: 0.5,
          fontWeight: 600,
          color: 'text.secondary',
          fontSize: TABLE_FONT_SIZE,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Preset 組合
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Box sx={{ flex: 1.2 }} />
          {scenarios.map(s => (
            <Typography
              key={s.key}
              variant="caption"
              sx={{
                flex: 1,
                textAlign: 'center',
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: TABLE_FONT_SIZE,
              }}
            >
              {s.label}
            </Typography>
          ))}
        </Box>
        {/* Rows */}
        {COMBO_LABELS.map(({ key, label }) => (
          <Box
            key={key}
            sx={{
              display: 'flex',
              gap: 0.5,
              py: 0.25,
              px: 0.5,
              borderRadius: 0.75,
              bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography
              variant="caption"
              sx={{ flex: 1.2, fontSize: TABLE_FONT_SIZE, fontWeight: 500 }}
            >
              {label}
            </Typography>
            {scenarios.map(s => (
              <Typography
                key={s.key}
                variant="caption"
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: TABLE_FONT_SIZE,
                  fontWeight: 600,
                }}
              >
                {combinations[s.key]?.[key] != null
                  ? combinations[s.key][key]
                  : '-'}
              </Typography>
            ))}
          </Box>
        ))}
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
  const [snackOpen, setSnackOpen] = useState(false);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/character/${encodeURIComponent(character.character_name)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSnackOpen(true);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setSnackOpen(true);
    }
  }, [character.character_name]);

  return (
    <CardContent
      role="region"
      aria-labelledby={`character-${character.ocid || character.character_name}`}
      sx={{ p: 3 }}
    >
      {/* === Layer 1: Identity — Avatar + Name + Level === */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      >
        <Avatar
          src={character.character_image || undefined}
          alt={`${character.character_name} 角色頭像`}
          sx={{
            width: { xs: 64, md: 80 },
            height: { xs: 64, md: 80 },
            flexShrink: 0,
            fontSize: { xs: 24, md: 28 },
            fontWeight: 700,
            bgcolor: theme =>
              character.character_image
                ? 'transparent'
                : alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
          }}
        >
          {!character.character_image && (character.character_name?.[0] || '?')}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              id={`character-${character.ocid || character.character_name}`}
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 700,
                wordBreak: 'break-word',
                lineHeight: 1.2,
              }}
            >
              {character.character_name}
            </Typography>
            <Chip
              label={`Lv.${character.character_level}`}
              size="small"
              color="primary"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 22,
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mt: 0.25 }}
          >
            {character.world_name}
          </Typography>
        </Box>
      </Box>

      {/* === Layer 2: Battle Power hero display === */}
      {(presetAnalysis || battlePower) && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
            border: theme =>
              `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          {presetAnalysis && presetAnalysis.bossing ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 3 },
              }}
            >
              {/* Primary: bossing power (hero number) */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.5,
                  }}
                >
                  <ShieldIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                    }}
                  >
                    戰鬥力
                  </Typography>
                </Box>
                {[
                  {
                    label: '打王',
                    data: presetAnalysis.bossing,
                    isHighlight: true,
                  },
                  {
                    label: '目前',
                    data: presetAnalysis.current,
                    isHighlight: false,
                  },
                  ...(presetAnalysis.leveling
                    ? [
                        {
                          label: '練等',
                          data: presetAnalysis.leveling,
                          isHighlight: false,
                        },
                      ]
                    : []),
                ].map(({ label, data, isHighlight }) => (
                  <PowerRow
                    key={label}
                    label={label}
                    data={data}
                    isHighlight={isHighlight}
                  />
                ))}
              </Box>

              {/* Preset combination table */}
              {presetAnalysis.presetCombinations && (
                <Box
                  sx={{
                    flex: 1,
                    borderLeft: { xs: 'none', sm: '1px solid' },
                    borderTop: { xs: '1px solid', sm: 'none' },
                    borderColor: theme => alpha(theme.palette.divider, 0.15),
                    pl: { xs: 0, sm: 2 },
                    pt: { xs: 1, sm: 0 },
                  }}
                >
                  <PresetCombinationTable
                    combinations={presetAnalysis.presetCombinations}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <ShieldIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: 'text.secondary',
                    lineHeight: 1,
                    mb: 0.25,
                  }}
                >
                  戰鬥力
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontFamily: '"Comic Neue", cursive',
                    color: 'primary.main',
                    userSelect: 'all',
                    lineHeight: 1,
                  }}
                >
                  {formatPower(battlePower)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* === Layer 3: Character attributes === */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          mb: 2,
        }}
      >
        <Chip
          icon={<WorkIcon sx={{ fontSize: ICON_SIZE }} />}
          label={`${character.character_class} ${character.character_class_level}`}
          size="small"
          variant="outlined"
          sx={{ px: 1 }}
        />
        {character.character_guild_name && (
          <Link
            href={`/guild/${encodeURIComponent(character.world_name)}/${encodeURIComponent(character.character_guild_name)}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <Chip
              icon={<GroupsIcon sx={{ fontSize: ICON_SIZE }} />}
              label={character.character_guild_name}
              size="small"
              variant="outlined"
              sx={{ px: 1, cursor: 'pointer' }}
            />
          </Link>
        )}
        {unionData && (
          <>
            <Chip
              icon={<MilitaryTechIcon sx={{ fontSize: ICON_SIZE }} />}
              label={`${unionData.union_grade} Lv.${unionData.union_level}`}
              size="small"
              variant="outlined"
              sx={{ px: 1 }}
            />
            <Chip
              icon={<DiamondIcon sx={{ fontSize: ICON_SIZE }} />}
              label={`神器 Lv.${unionData.union_artifact_level}`}
              size="small"
              variant="outlined"
              sx={{ px: 1 }}
            />
          </>
        )}
      </Box>

      {/* === Layer 4: Actions + meta === */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEquipmentClick && (
            <Button
              variant="outlined"
              size="small"
              onClick={onEquipmentClick}
              sx={{ fontWeight: 600 }}
            >
              裝備
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={handleShare}
            startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
            sx={{ fontWeight: 600 }}
          >
            分享
          </Button>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: '0.7rem' }}
          >
            {formatTimestamp(character.date)}
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="已複製分享連結"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </CardContent>
  );
});

export default CharacterCard;
