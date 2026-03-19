import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/mysql-core';
import { characters } from './schema.js';

export const guilds = mysqlTable(
  'guilds',
  {
    oguildId: varchar('oguild_id', { length: 64 }).primaryKey(),
    guildName: varchar('guild_name', { length: 100 }).notNull(),
    worldName: varchar('world_name', { length: 20 }).notNull(),
    guildLevel: int('guild_level'),
    guildFame: int('guild_fame'),
    guildPoint: int('guild_point'),
    guildMasterName: varchar('guild_master_name', { length: 50 }),
    guildMemberCount: int('guild_member_count'),
    guildMark: text('guild_mark'),
    guildMarkCustom: text('guild_mark_custom'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_guild_name_world').on(table.guildName, table.worldName)]
);

export const guildSkills = mysqlTable(
  'guild_skills',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    oguildId: varchar('oguild_id', { length: 64 })
      .notNull()
      .references(() => guilds.oguildId, { onDelete: 'cascade' }),
    skillType: varchar('skill_type', { length: 10 }).notNull(),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    skillDescription: text('skill_description'),
    skillLevel: int('skill_level'),
    skillEffect: text('skill_effect'),
    skillIcon: text('skill_icon'),
  },
  table => [
    uniqueIndex('idx_guild_skill_unique').on(
      table.oguildId,
      table.skillType,
      table.skillName
    ),
  ]
);

export const guildMembers = mysqlTable(
  'guild_members',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    oguildId: varchar('oguild_id', { length: 64 })
      .notNull()
      .references(() => guilds.oguildId, { onDelete: 'cascade' }),
    characterName: varchar('character_name', { length: 50 }).notNull(),
    ocid: varchar('ocid', { length: 64 }).references(() => characters.ocid, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    index('idx_guild_member_oguild').on(table.oguildId),
    index('idx_guild_member_ocid').on(table.ocid),
  ]
);
