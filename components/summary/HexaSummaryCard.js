'use client';

import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DiamondIcon from '@mui/icons-material/Diamond';
import { filterHexaCoreSkills } from '../../lib/hexaMatrixUtils';
import { calculateHexaMatrixProgress } from '../../lib/progressUtils';
import PanelEmpty from '../panel/PanelEmpty';
import SectionTitle from '../panel/SectionTitle';

const HEXA_CORE_MAX_LEVEL = 30;

/**
 * Compact HEXA matrix summary — total equipment-core completion % and maxed
 * core count. Full radar chart + resource costs live in HexaMatrixProgress
 * (rendered in the collapsible 成長追蹤 section), which this does not
 * re-derive.
 */
const HexaSummaryCard = ({ hexaCoreData }) => {
  const hexaCores = hexaCoreData?.character_hexa_core_equipment;

  if (!hexaCores?.length) {
    return (
      <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <SectionTitle>HEXA 摘要</SectionTitle>
          <PanelEmpty message="尚無六轉核心資料" />
        </CardContent>
      </Card>
    );
  }

  const filteredCores = filterHexaCoreSkills(hexaCores);
  const progress = calculateHexaMatrixProgress({
    character_hexa_core_equipment: filteredCores,
  });
  const totalProgress =
    typeof progress.totalProgress === 'number' &&
    !Number.isNaN(progress.totalProgress)
      ? progress.totalProgress
      : 0;
  const maxedCount = progress.equipmentCores.filter(
    core => core.level >= HEXA_CORE_MAX_LEVEL
  ).length;

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle>HEXA 摘要</SectionTitle>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              fontFamily: '"Comic Neue", cursive',
            }}
          >
            {totalProgress.toFixed(1)}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            裝備核心完成度
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<WhatshotIcon sx={{ fontSize: 14 }} />}
            label="六轉已解鎖"
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
            }}
          />
          {maxedCount > 0 && (
            <Chip
              icon={<DiamondIcon sx={{ fontSize: 14 }} />}
              label={`核心滿級 x${maxedCount}`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HexaSummaryCard;
