CREATE TABLE `guild_exp_snapshots` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`oguild_id` varchar(64) NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`snapshot_date` date NOT NULL,
	`character_level` int,
	`character_exp_rate` varchar(20),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `guild_exp_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_snapshot_unique` UNIQUE(`oguild_id`,`ocid`,`snapshot_date`)
);
--> statement-breakpoint
ALTER TABLE `guild_exp_snapshots` ADD CONSTRAINT `guild_exp_snapshots_oguild_id_guilds_oguild_id_fk` FOREIGN KEY (`oguild_id`) REFERENCES `guilds`(`oguild_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guild_exp_snapshots` ADD CONSTRAINT `guild_exp_snapshots_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_snapshot_oguild_date` ON `guild_exp_snapshots` (`oguild_id`,`snapshot_date`);