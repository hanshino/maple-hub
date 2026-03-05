'use client';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

const UnionRaiderPanel = ({ loading, error, data, onRetry }) => {
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

  const stats = data?.union_raider_stat ?? [];

  if (stats.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">尚無聯盟戰地資料</Typography>
      </Box>
    );
  }

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
      <Table
        size="small"
        sx={{ '& .MuiTableCell-root': { border: 'none' } }}
      >
        <TableBody>
          {stats.map((stat, i) => (
            <TableRow key={i}>
              <TableCell>
                <Typography variant="body2">{stat}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default UnionRaiderPanel;
