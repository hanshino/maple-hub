import cron from 'node-cron';

export function initCronJobs() {
  console.log('Initializing cron jobs...');

  // Refresh stale characters every 6 hours (only those not updated recently)
  cron.schedule('0 */6 * * *', async () => {
    try {
      const { getStaleOcids, deleteStaleCharacters } =
        await import('./db/queries.js');
      const { syncAllCharacters } = await import('./characterSyncService.js');

      const ocids = await getStaleOcids(6);
      if (ocids.length === 0) {
        console.log('No stale characters to refresh');
        return;
      }
      console.log(`Refreshing ${ocids.length} stale characters...`);

      const stats = await syncAllCharacters(ocids);
      const deleted = await deleteStaleCharacters(3);

      console.log('Refresh complete:', stats, `Deleted stale: ${deleted}`);
    } catch (error) {
      console.error('Refresh-all cron error:', error);
    }
  });

  // Cleanup stale characters daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const { deleteStaleCharacters } = await import('./db/queries.js');
      const deleted = await deleteStaleCharacters(3);
      console.log(`Cleanup: removed ${deleted} stale characters`);
    } catch (error) {
      console.error('Cleanup cron error:', error);
    }
  });

  // Cleanup old exp snapshots daily at 00:30
  cron.schedule('30 0 * * *', async () => {
    try {
      const { deleteOldExpSnapshots } = await import('./db/guildQueries.js');
      const deleted = await deleteOldExpSnapshots(30);
      console.log(
        `[Cron] Exp snapshot cleanup: removed ${deleted} old records`
      );
    } catch (error) {
      console.error('[Cron] Exp snapshot cleanup error:', error);
    }
  });

  // Refresh recently viewed guilds every 6 hours (offset 30 min from character refresh)
  cron.schedule('30 */6 * * *', async () => {
    try {
      const { getGuildsByRecentActivity } =
        await import('./db/guildQueries.js');
      const { searchAndSyncGuild, startGuildSync } =
        await import('./guildSyncService.js');

      const guilds = await getGuildsByRecentActivity(7);
      console.log(`[Cron] Refreshing ${guilds.length} active guilds`);

      for (const guild of guilds) {
        try {
          await searchAndSyncGuild(guild.guildName, guild.worldName);
          await startGuildSync(guild.oguildId);
          console.log(`[Cron] Refreshed guild: ${guild.guildName}`);
        } catch (error) {
          console.error(
            `[Cron] Failed to refresh guild ${guild.guildName}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error('[Cron] Guild refresh error:', error);
    }
  });

  console.log('Cron jobs initialized');
}
