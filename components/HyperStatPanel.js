'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import PanelSkeleton from './panel/PanelSkeleton';
import PanelError from './panel/PanelError';
import PanelEmpty from './panel/PanelEmpty';
import SectionHeader from './panel/SectionHeader';

const HyperStatPanel = ({ loading, error, data, onRetry }) => {
  const [presetIndex, setPresetIndex] = useState(0);

  if (loading) return <PanelSkeleton rows={5} />;

  if (error) {
    return <PanelError message="無法載入極限屬性資料" onRetry={onRetry} />;
  }

  if (!data) return <PanelEmpty message="尚無極限屬性資料" />;

  const activePreset = data.use_preset_no ?? '1';
  const presets = [
    data.hyper_stat_preset_1 ?? [],
    data.hyper_stat_preset_2 ?? [],
    data.hyper_stat_preset_3 ?? [],
  ];

  const currentStats = (presets[presetIndex] ?? []).filter(
    s => s.stat_level > 0
  );

  return (
    <Box sx={{ mt: 1 }}>
      <SectionHeader description="極限屬性各項目的等級與加成效果" />

      <ToggleButtonGroup
        value={presetIndex}
        exclusive
        onChange={(_, v) => v !== null && setPresetIndex(v)}
        size="small"
        sx={{ mb: 2 }}
        aria-label="極限屬性預設選擇"
      >
        {[0, 1, 2].map(i => (
          <ToggleButton
            key={i}
            value={i}
            sx={{ px: 2, borderRadius: '20px !important', gap: 0.5 }}
          >
            預設 {i + 1}
            {activePreset === String(i + 1) && (
              <Chip
                label="使用中"
                size="small"
                color="primary"
                sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {currentStats.length === 0 ? (
        <PanelEmpty message="此預設尚未設定極限屬性" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{ '& .MuiTableCell-root': { border: 'none' } }}
          >
            <TableBody>
              {currentStats.map((stat, i) => (
                <TableRow
                  key={i}
                  sx={{
                    '&:hover': {
                      bgcolor: theme => `${theme.palette.primary.main}0a`,
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {stat.stat_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Lv.${stat.stat_level}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'primary.main' }}
                    >
                      {stat.stat_increase}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default HyperStatPanel;
