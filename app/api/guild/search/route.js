import { NextResponse } from 'next/server';
import {
  searchAndSyncGuild,
  startGuildSync,
} from '../../../../lib/guildSyncService.js';
import { getCached, setCache } from '../../../../lib/redis.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const world = searchParams.get('world');

  if (!name || !world) {
    return NextResponse.json(
      { error: 'name and world are required' },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `guild:search:${world}:${name}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { oguildId, guildInfo, memberCount } = await searchAndSyncGuild(
      name,
      world
    );

    const syncStatus = await startGuildSync(oguildId);

    const result = {
      oguildId,
      guildName: guildInfo.guild_name,
      worldName: guildInfo.world_name,
      guildLevel: guildInfo.guild_level,
      guildFame: guildInfo.guild_fame,
      guildPoint: guildInfo.guild_point,
      guildMasterName: guildInfo.guild_master_name,
      memberCount,
      syncStatus,
    };

    setCache(cacheKey, result, 600).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('Guild search error:', error);

    if (error.message.includes('404') || error.message.includes('not found')) {
      return NextResponse.json({ error: '找不到此工會' }, { status: 404 });
    }

    return NextResponse.json(
      { error: '搜尋工會時發生錯誤' },
      { status: 500 }
    );
  }
}
