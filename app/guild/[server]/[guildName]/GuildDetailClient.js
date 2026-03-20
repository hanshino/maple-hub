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
const EXP_POLL_INTERVAL = 8000;

export default function GuildDetailClient({ server, guildName }) {
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oguildId, setOguildId] = useState(null);
  const [expGrowth, setExpGrowth] = useState(null);

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

  // Fetch exp growth data once we have oguildId
  const fetchExpGrowth = useCallback(async id => {
    try {
      const res = await fetch(`/api/guild/${id}/exp-growth`);
      if (!res.ok) return;
      const data = await res.json();
      setExpGrowth(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!oguildId) return;
    fetchExpGrowth(oguildId);
  }, [oguildId, fetchExpGrowth]);

  // Poll while exp backfill is in progress
  useEffect(() => {
    if (!oguildId || !expGrowth?.backfillStatus?.inProgress) return;
    const interval = setInterval(
      () => fetchExpGrowth(oguildId),
      EXP_POLL_INTERVAL
    );
    return () => clearInterval(interval);
  }, [oguildId, expGrowth?.backfillStatus?.inProgress, fetchExpGrowth]);

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
          // Sync finished — fetch full guild data + exp growth
          const detailRes = await fetch(`/api/guild/${oguildId}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setGuild(detailData);
          }
          fetchExpGrowth(oguildId);
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

  // Merge exp growth data into members
  const members = guild.members || [];
  const membersWithGrowth = expGrowth
    ? members.map(m => {
        const growth = expGrowth.members?.find(
          g => g.characterName === m.characterName
        );
        return growth
          ? {
              ...m,
              growth7: growth.growth7,
              growth30: growth.growth30,
              effortRank7: growth.effortRank7,
              effortRank30: growth.effortRank30,
            }
          : m;
      })
    : members;

  return (
    <>
      <GuildInfoCard guild={guild} />
      <GuildSyncProgress
        syncStatus={guild.syncStatus}
        backfillStatus={expGrowth?.backfillStatus}
      />
      <GuildMyPosition members={membersWithGrowth} />
      <GuildHighlights members={membersWithGrowth} />
      <GuildDistributions members={membersWithGrowth} />
      <GuildMemberTable members={membersWithGrowth} />
    </>
  );
}
