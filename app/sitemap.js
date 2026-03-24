import { getDb } from '../lib/db/index.js';
import { guilds } from '../lib/db/guildSchema.js';

// Force dynamic rendering — DB is not available at build time
export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://maple-hub.hanshino.dev';

export default async function sitemap() {
  const db = getDb();

  // Static pages
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guild`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Guild pages
  const guildRows = await db
    .select({
      guildName: guilds.guildName,
      worldName: guilds.worldName,
      updatedAt: guilds.updatedAt,
    })
    .from(guilds);

  const guildPages = guildRows.map(row => ({
    url: `${SITE_URL}/guild/${encodeURIComponent(row.worldName)}/${encodeURIComponent(row.guildName)}`,
    lastModified: row.updatedAt || new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  return [...staticPages, ...guildPages];
}
