import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';

export default function HexaStatTable({ cores }) {
  if (!cores || cores.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          六轉屬性核心
        </Typography>
        <Typography variant="body2" color="text.secondary">
          尚未啟用任何屬性核心
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        六轉屬性核心
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
              主要屬性
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
              副屬性1
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
              副屬性2
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>
              等級
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cores.map((core, index) => (
            <TableRow key={`${core.slot_id || 'unknown'}-${index}`}>
              <TableCell>
                {core.main_stat_name ? (
                  `${core.main_stat_name} (Lv ${core.main_stat_level})`
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    未啟用
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {core.sub_stat_name_1 ? (
                  `${core.sub_stat_name_1} (Lv ${core.sub_stat_level_1})`
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {core.sub_stat_name_2 ? (
                  `${core.sub_stat_name_2} (Lv ${core.sub_stat_level_2})`
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color:
                      core.stat_grade === 0
                        ? 'text.secondary'
                        : core.stat_grade === 20
                          ? 'success.main'
                          : 'primary.main',
                  }}
                >
                  {core.stat_grade}/20
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
