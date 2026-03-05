'use client';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from '@mui/material';

const UnionArtifactPanel = ({ loading, error, data, onRetry }) => {
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

  const crystals = data?.union_artifact_crystal ?? [];
  const effects = data?.union_artifact_effect ?? [];

  if (crystals.length === 0 && effects.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">尚無聯盟神器資料</Typography>
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
      {crystals.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, px: 1, pt: 1, pb: 0.5 }}
          >
            水晶
          </Typography>
          <Table
            size="small"
            sx={{ '& .MuiTableCell-root': { border: 'none' } }}
          >
            <TableBody>
              {crystals.map((crystal, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="body2">{crystal.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Lv.${crystal.level}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {crystal.crystal_option_name_1}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {crystals.length > 0 && effects.length > 0 && (
        <Divider sx={{ my: 1 }} />
      )}

      {effects.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, px: 1, pt: 0.5, pb: 0.5 }}
          >
            效果
          </Typography>
          <Table
            size="small"
            sx={{ '& .MuiTableCell-root': { border: 'none' } }}
          >
            <TableBody>
              {effects.map((effect, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="body2">{effect.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Lv.{effect.level}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
};

export default UnionArtifactPanel;
