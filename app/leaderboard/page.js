import { Container, Typography, Box } from '@mui/material';
import LeaderboardList from '../../components/LeaderboardList';

export const metadata = {
  title: '戰力排行榜 | Maple Hub',
  description: '查看 MapleStory 角色戰力排行榜',
};

/**
 * Leaderboard page
 * Displays combat power rankings with infinite scroll
 */
export default function LeaderboardPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          戰力排行榜
        </Typography>
        <Typography variant="body1" color="text.secondary">
          依戰力由高到低排序的角色排行榜
        </Typography>
      </Box>

      <LeaderboardList />
    </Container>
  );
}
