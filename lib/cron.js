import cron from 'node-cron';

export function initCronJobs() {
  console.log('Initializing cron jobs...');

  // Sync OCID buffer to DB every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { flushOcidBuffer } = await import('./redis.js');
      const { upsertCharacters } = await import('./db/queries.js');

      const ocids = await flushOcidBuffer();
      if (ocids.length > 0) {
        await upsertCharacters(
          ocids.map(ocid => ({ ocid, status: 'success', notFoundCount: 0 }))
        );
        console.log(`Synced ${ocids.length} buffered OCIDs`);
      }
    } catch (error) {
      console.error('OCID sync cron error:', error);
    }
  });

  // Refresh all characters every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const { getAllOcids, deleteStaleCharacters } = await import(
        './db/queries.js'
      );
      const { syncAllCharacters } = await import(
        './characterSyncService.js'
      );

      const ocids = await getAllOcids();
      console.log(`Starting refresh for ${ocids.length} characters...`);

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

  console.log('Cron jobs initialized');
}
