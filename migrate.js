import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'maple_hub',
    password: process.env.DB_PASSWORD || 'maple_hub',
    database: process.env.DB_NAME || 'maple_hub',
  });

  const db = drizzle(connection);
  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  await connection.end();
  console.log('Migrations complete');
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
