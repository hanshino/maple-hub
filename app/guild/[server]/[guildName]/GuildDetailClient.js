'use client';

import { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Alert, Box } from '@mui/material';
import { track } from '@/lib/analytics';
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
      track('guild_view', {
        world: server,
        guildName,
        memberCount: detailData.members?.length || 0,
      });
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
        const statusRes = await fetch(`/api/guild/${oguildId}/sync-status`);
        if (!statusRes.ok) return;
        const statusData = await statusRes.json();

        // Update syncStatus without triggering a full re-fetch
        setGuild(prev => ({ ...prev, syncStatus: statusData }));

        if (!statusData.inProgress) {
          clearInterval(interval);
          track('guild_sync_complete', {
            total: statusData.total,
            synced: statusData.synced,
            failed: statusData.failed,
          });
          // Sync finished — fetch full guild data once
          const detailRes = await fetch(`/api/guild/${oguildId}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setGuild(detailData);
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
      <GuildMyPosition members={guild.members || []} />
      <GuildHighlights members={guild.members || []} />
      <GuildDistributions members={guild.members || []} />
      <GuildMemberTable members={guild.members || []} />
    </>
  );
}
