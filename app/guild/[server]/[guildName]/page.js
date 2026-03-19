import { Container } from '@mui/material';
import GuildDetailClient from './GuildDetailClient';
import { getGuildByNameAndWorld } from '../../../../lib/db/guildQueries.js';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://maple-hub.hanshino.dev';

export async function generateMetadata({ params }) {
  const { server, guildName } = await params;
  const decodedGuild = decodeURIComponent(guildName);
  const decodedServer = decodeURIComponent(server);

  const guild = await getGuildByNameAndWorld(decodedGuild, decodedServer);

  if (!guild) {
    return {
      title: `${decodedGuild} - ${decodedServer} | Maple Hub`,
      description: `查看 ${decodedServer} 伺服器 ${decodedGuild} 工會的成員排行、職業分布與數據分析`,
    };
  }

  const title = `${guild.guildName} — Lv.${guild.guildLevel} 工會 · ${decodedServer}`;
  const description = [
    `${guild.guildMemberCount} 位成員`,
    `會長: ${guild.guildMasterName}`,
    guild.guildFame && `名聲 ${guild.guildFame.toLocaleString()}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title: `${guild.guildName} | Maple Hub`,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Maple Hub',
      type: 'website',
      url: `${SITE_URL}/guild/${encodeURIComponent(decodedServer)}/${encodeURIComponent(decodedGuild)}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
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
