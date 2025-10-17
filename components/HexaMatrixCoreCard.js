import { Card, CardContent, Typography, LinearProgress } from '@mui/material';

export default function HexaMatrixCoreCard({ core }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{core.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          Type: {core.type} | Level: {core.level}/30
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Progress: {core.progress.toFixed(1)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={core.progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.300',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: 'secondary.main',
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
