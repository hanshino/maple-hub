'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

const HyperStatPanel = ({ loading, error, data, onRetry }) => {
  const [tabIndex, setTabIndex] = useState(0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                重試
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">尚無超級能力值資料</Typography>
      </Box>
    );
  }

  const activePreset = data.use_preset_no ?? '1';
  const presets = [
    data.hyper_stat_preset_1 ?? [],
    data.hyper_stat_preset_2 ?? [],
    data.hyper_stat_preset_3 ?? [],
  ];

  const currentStats = (presets[tabIndex] ?? []).filter(
    (s) => s.stat_level > 0
  );

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        p: 1,
      }}
    >
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="fullWidth"
        sx={{ mb: 1 }}
      >
        {[1, 2, 3].map((n, i) => (
          <Tab
            key={n}
            label={`預設 ${n}${activePreset === String(n) ? ' (使用中)' : ''}`}
            value={i}
          />
        ))}
      </Tabs>

      {currentStats.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">此預設無超級能力值資料</Typography>
        </Box>
      ) : (
        <Table
          size="small"
          sx={{ '& .MuiTableCell-root': { border: 'none' } }}
        >
          <TableBody>
            {currentStats.map((stat, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Typography variant="body2">{stat.stat_type}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    Lv.{stat.stat_level}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: 'primary.main' }}
                  >
                    {stat.stat_increase}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default HyperStatPanel;
