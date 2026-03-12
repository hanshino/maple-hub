'use client';

import React, { useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { processStatsData, formatStatValue } from '../lib/statsUtils';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const CharacterStats = ({ statsData }) => {
  const stats = useMemo(() => {
    if (!statsData) return [];
    return processStatsData(statsData);
  }, [statsData]);

  const coreStatsGroup1 = ['STR', 'DEX', 'INT', 'LUK', 'HP', 'MP'];
  const coreStatsGroup2 = [
    '星力',
    '神秘力量',
    '真實之力',
    '道具掉落率',
    '楓幣獲得量',
    '獲得額外經驗值',
  ];
  const hiddenStats = [
    '狀態異常耐性',
    '格擋',
    '防禦力',
    '移動速度',
    '跳躍力',
    '攻擊速度',
    '無視屬性耐性',
    '狀態異常追加傷害',
    '武器熟練度',
  ];

  const group1Data = stats.filter(s => coreStatsGroup1.includes(s.name));
  const group2Data = stats.filter(s => coreStatsGroup2.includes(s.name));
  const otherStats = stats.filter(
    s =>
      !coreStatsGroup1.includes(s.name) &&
      !coreStatsGroup2.includes(s.name) &&
      !hiddenStats.includes(s.name)
  );

  const renderStatGroup = (groupStats, key) => (
    <Box
      key={key}
      sx={{
        bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
        borderRadius: 2,
        p: 1.5,
        mb: 1.5,
      }}
    >
      <Grid container spacing={1}>
        {groupStats.map(stat => (
          <Grid key={stat.name} size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.75,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {stat.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'primary.main' }}
              >
                {formatStatValue(stat.value)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="角色最終能力值，包含所有加成來源" />
      {stats.length === 0 ? (
        <PanelEmpty message="尚無能力值資料" />
      ) : (
        <>
          {group1Data.length > 0 && renderStatGroup(group1Data, 'group1')}
          {group2Data.length > 0 && renderStatGroup(group2Data, 'group2')}
          {otherStats.length > 0 && renderStatGroup(otherStats, 'group3')}
        </>
      )}
    </Box>
  );
};

export default CharacterStats;
