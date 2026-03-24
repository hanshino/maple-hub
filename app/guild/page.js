import { Container, Typography, Box } from '@mui/material';
import GuildSearch from '../../components/GuildSearch';

export const metadata = {
  title: '工會搜尋',
  description:
    '搜尋 MapleStory TW 工會，查看成員戰力排行、職業分布、等級分析與工會數據。',
  alternates: {
    canonical: '/guild',
  },
};

export default function GuildPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
          工會搜尋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          輸入工會名稱與伺服器，查看工會成員與數據分析
        </Typography>
      </Box>

      <GuildSearch />
    </Container>
  );
}
