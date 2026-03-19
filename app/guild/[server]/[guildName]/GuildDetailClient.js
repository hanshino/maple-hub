'use client';

import { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Alert, Box } from '@mui/material';
import GuildInfoCard from '../../../../components/GuildInfoCard';
import GuildMemberTable from '../../../../components/GuildMemberTable';
import GuildSyncProgress from '../../../../components/GuildSyncProgress';
import GuildDistributions from '../../../../components/GuildDistributions';
import GuildMyPosition from '../../../../components/GuildMyPosition';
import GuildHighlights from '../../../../components/GuildHighlights';

const POLL_INTERVAL = 5000;

export default function GuildDetailClient({ server, guildName }) {
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oguildId, setOguildId] = useState(null);

  const fetchGuild = useCallback(async () => {
    try {
      const searchRes = await fetch(
        `/api/guild/search?name=${encodeURIComponent(guildName)}&world=${encodeURIComponent(server)}`
      );
      if (!searchRes.ok) {
        const data = await searchRes.json();
        throw new Error(data.error || '搜尋失敗');
      }
      const searchData = await searchRes.json();
      setOguildId(searchData.oguildId);

      const detailRes = await fetch(`/api/guild/${searchData.oguildId}`);
      if (!detailRes.ok) throw new Error('取得工會資料失敗');
      const detailData = await detailRes.json();
      setGuild(detailData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [guildName, server]);

  useEffect(() => {
    fetchGuild();
  }, [fetchGuild]);

  useEffect(() => {
    if (!oguildId || !guild?.syncStatus?.inProgress) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/guild/${oguildId}`);
        if (res.ok) {
          const data = await res.json();
          setGuild(data);

          if (!data.syncStatus?.inProgress) {
            clearInterval(interval);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [oguildId, guild?.syncStatus?.inProgress]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!guild) return null;

  return (
    <>
      <GuildInfoCard guild={guild} />
      <GuildSyncProgress syncStatus={guild.syncStatus} />
      <GuildHighlights members={guild.members || []} />
      <GuildDistributions members={guild.members || []} />
      <GuildMyPosition members={guild.members || []} />
      <GuildMemberTable members={guild.members || []} />
    </>
  );
}
