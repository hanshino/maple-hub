import cron from 'node-cron';

export function initCronJobs() {
  console.log('Initializing cron jobs...');

  // Refresh stale characters every 6 hours (only those not updated recently)
  cron.schedule('0 */6 * * *', async () => {
    try {
      const { getStaleOcids, deleteStaleCharacters } = await import(
        './db/queries.js'
      );
      const { syncAllCharacters } = await import(
        './characterSyncService.js'
      );

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

  console.log('Cron jobs initialized');
}
