import {
  mysqlTable,
  bigint,
  varchar,
  int,
  date,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { guilds } from './guildSchema.js';
import { characters } from './schema.js';

export const guildExpSnapshots = mysqlTable(
  'guild_exp_snapshots',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    oguildId: varchar('oguild_id', { length: 64 })
      .notNull()
      .references(() => guilds.oguildId, { onDelete: 'cascade' }),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    snapshotDate: date('snapshot_date').notNull(),
    characterLevel: int('character_level'),
    characterExpRate: varchar('character_exp_rate', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => [
    uniqueIndex('idx_snapshot_unique').on(
      table.oguildId,
      table.ocid,
      table.snapshotDate
    ),
    index('idx_snapshot_oguild_date').on(table.oguildId, table.snapshotDate),
  ]
);
