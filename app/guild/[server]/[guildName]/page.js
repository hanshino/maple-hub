import { Container } from '@mui/material';
import GuildDetailClient from './GuildDetailClient';

export async function generateMetadata({ params }) {
  const { server, guildName } = await params;
  const decodedGuild = decodeURIComponent(guildName);
  const decodedServer = decodeURIComponent(server);

  return {
    title: `${decodedGuild} - ${decodedServer} | Maple Hub`,
    description: `查看 ${decodedServer} 伺服器 ${decodedGuild} 工會的成員排行、職業分布與數據分析`,
  };
}

export default async function GuildDetailPage({ params }) {
  const { server, guildName } = await params;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GuildDetailClient
        server={decodeURIComponent(server)}
        guildName={decodeURIComponent(guildName)}
      />
    </Container>
  );
}
