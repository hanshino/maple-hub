'use client';

import { Box, Chip, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import StarsIcon from '@mui/icons-material/Stars';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DiamondIcon from '@mui/icons-material/Diamond';
import GroupsIcon from '@mui/icons-material/Groups';
import ShieldIcon from '@mui/icons-material/Shield';
import { filterHexaCoreSkills } from '../lib/hexaMatrixUtils';
import { calculateHexaMatrixProgress } from '../lib/progressUtils';

const HEXA_CORE_MAX_LEVEL = 30;
const STARFORCE_THRESHOLD = 22;
const LEVEL_MILESTONES = [290, 280, 270, 260];
const UNION_LEVEL_MILESTONES = [10000, 9000, 8000];
const UNION_ARTIFACT_MILESTONES = [20, 15, 10, 5];
const LEGENDARY_GRADE = '傳說';
// TWMS OpenAPI exposes `starforce`, but not whether a zero-star item is
// eligible or its max-star cap. Keep this conservative canonical-slot
// heuristic local; unfamiliar/future slots are intentionally ignored and the
// UI labels the result as an estimate.
const STARFORCE_ELIGIBLE_SLOTS = new Set([
  '帽子',
  '臉飾',
  '眼飾',
  '耳環',
  '上衣',
  '褲/裙',
  '套服',
  '鞋子',
  '手套',
  '披風',
  '戒指1',
  '戒指2',
  '戒指3',
  '戒指4',
  '墜飾',
  '墜飾2',
  '腰帶',
  '肩膀裝飾',
  '機器心臟',
  '武器',
  '輔助武器',
]);

const ICON_SIZE = 14;

const pickHighestMilestone = (value, milestones) => {
  if (value == null) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return null;
  return milestones.find(m => num >= m) ?? null;
};

const chipSx = color => ({
  height: 24,
  px: 1,
  fontWeight: 700,
  fontSize: '0.7rem',
  color,
  border: theme =>
    `1px solid ${alpha(color || theme.palette.primary.main, 0.4)}`,
  bgcolor: theme => alpha(color || theme.palette.primary.main, 0.1),
  '& .MuiChip-icon': { color },
});

const buildBadges = ({ character, equipment, unionData, hexaCoreData }) => {
  const badges = [];

  // --- Level milestone ---
  const levelMilestone = pickHighestMilestone(
    character?.character_level,
    LEVEL_MILESTONES
  );
  if (levelMilestone) {
    badges.push({
      id: 'level',
      icon: <TrendingUpIcon sx={{ fontSize: ICON_SIZE }} />,
      label: `Lv.${levelMilestone}+`,
      tooltip: `角色等級達到 ${levelMilestone} 級`,
      color: '#42a5f5',
    });
  }

  // --- Starforce ---
  const equipItems = equipment ? Object.values(equipment).filter(Boolean) : [];
  const starforceItems = equipItems.filter(item => {
    const star = parseInt(item.starforce);
    return !Number.isNaN(star) && star > 0;
  });
  if (starforceItems.length > 0) {
    const maxStar = Math.max(
      ...starforceItems.map(item => parseInt(item.starforce) || 0)
    );
    if (maxStar >= STARFORCE_THRESHOLD) {
      badges.push({
        id: 'star-any',
        icon: <StarIcon sx={{ fontSize: ICON_SIZE }} />,
        label: `★${STARFORCE_THRESHOLD}+`,
        tooltip: `至少一件裝備星力達到 ${STARFORCE_THRESHOLD} 星`,
        color: '#ffd54f',
      });
    }
    const eligibleItems = equipItems.filter(item =>
      STARFORCE_ELIGIBLE_SLOTS.has(item.item_equipment_slot)
    );
    const allEligibleMaxed =
      eligibleItems.length > 0 &&
      eligibleItems.every(
        item => (parseInt(item.starforce) || 0) >= STARFORCE_THRESHOLD
      );
    if (allEligibleMaxed) {
      badges.push({
        id: 'star-all',
        icon: <StarsIcon sx={{ fontSize: ICON_SIZE }} />,
        label: `全身★${STARFORCE_THRESHOLD}+`,
        tooltip: `依目前已裝備的可星力部位估算，皆達 ${STARFORCE_THRESHOLD} 星以上`,
        color: '#ffd54f',
      });
    }
  }

  // --- Potential: legendary count ---
  const legendaryCount = equipItems.filter(
    item => item.potential_option_grade === LEGENDARY_GRADE
  ).length;
  if (legendaryCount > 0) {
    badges.push({
      id: 'potential-legendary',
      icon: <AutoAwesomeIcon sx={{ fontSize: ICON_SIZE }} />,
      label: `傳說潛能 x${legendaryCount}`,
      tooltip: `擁有 ${legendaryCount} 件傳說等級潛能裝備`,
      color: '#66bb6a',
    });
  }

  // --- HEXA ---
  const hexaCores = hexaCoreData?.character_hexa_core_equipment;
  if (hexaCores?.length > 0) {
    badges.push({
      id: 'hexa-unlock',
      icon: <WhatshotIcon sx={{ fontSize: ICON_SIZE }} />,
      label: '六轉已解鎖',
      tooltip: '角色已解鎖六轉核心系統',
      color: '#f7931e',
    });

    const filteredCores = filterHexaCoreSkills(hexaCores);
    const progress = calculateHexaMatrixProgress({
      character_hexa_core_equipment: filteredCores,
    });
    const maxedCount = progress.equipmentCores.filter(
      core => core.level >= HEXA_CORE_MAX_LEVEL
    ).length;
    if (maxedCount > 0) {
      badges.push({
        id: 'hexa-maxed',
        icon: <DiamondIcon sx={{ fontSize: ICON_SIZE }} />,
        label: `核心滿級 x${maxedCount}`,
        tooltip: `已有 ${maxedCount} 個六轉核心達到滿級 (Lv.${HEXA_CORE_MAX_LEVEL})`,
        color: '#ba68c8',
      });
    }
  }

  // --- Union ---
  const unionLevelMilestone = pickHighestMilestone(
    unionData?.union_level,
    UNION_LEVEL_MILESTONES
  );
  if (unionLevelMilestone) {
    badges.push({
      id: 'union-level',
      icon: <GroupsIcon sx={{ fontSize: ICON_SIZE }} />,
      label: `聯盟 Lv.${unionLevelMilestone}+`,
      tooltip: `聯盟等級達到 ${unionLevelMilestone}`,
      color: '#7e57c2',
    });
  }

  const unionArtifactMilestone = pickHighestMilestone(
    unionData?.union_artifact_level,
    UNION_ARTIFACT_MILESTONES
  );
  if (unionArtifactMilestone) {
    badges.push({
      id: 'union-artifact',
      icon: <ShieldIcon sx={{ fontSize: ICON_SIZE }} />,
      label: `神器 Lv.${unionArtifactMilestone}+`,
      tooltip: `聯盟神器等級達到 ${unionArtifactMilestone}`,
      color: '#26a69a',
    });
  }

  return badges;
};

/**
 * Achievement badge strip — shows only milestones the character has actually
 * reached. Unreached thresholds are omitted entirely (no greyed-out state).
 *
 * Skipped by design (no reliable data/threshold source in this codebase):
 * 符文強化 (ARC/AUT) — no total arcane/authentic force calculator or
 * canonical in-game threshold exists in lib/runeUtils.js; fabricating one
 * would be a guess, not a fact.
 */
const AchievementBadges = ({
  character,
  equipment,
  unionData,
  hexaCoreData,
}) => {
  const badges = buildBadges({ character, equipment, unionData, hexaCoreData });

  if (badges.length === 0) return null;

  return (
    <Box
      role="list"
      aria-label="成就徽章"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        mt: 1.5,
      }}
    >
      {badges.map(badge => (
        <Tooltip key={badge.id} title={badge.tooltip} arrow>
          <Chip
            role="listitem"
            icon={badge.icon}
            label={badge.label}
            size="small"
            sx={chipSx(badge.color)}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default AchievementBadges;
