CREATE TABLE `guilds` (
	`oguild_id` varchar(64) NOT NULL,
	`guild_name` varchar(100) NOT NULL,
	`world_name` varchar(20) NOT NULL,
	`guild_level` int,
	`guild_fame` int,
	`guild_point` int,
	`guild_master_name` varchar(50),
	`guild_member_count` int,
	`guild_mark` text,
	`guild_mark_custom` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guilds_oguild_id` PRIMARY KEY(`oguild_id`)
);
--> statement-breakpoint
CREATE TABLE `guild_skills` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`oguild_id` varchar(64) NOT NULL,
	`skill_type` varchar(10) NOT NULL,
	`skill_name` varchar(100) NOT NULL,
	`skill_description` text,
	`skill_level` int,
	`skill_effect` text,
	`skill_icon` text,
	CONSTRAINT `guild_skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_guild_skill_unique` UNIQUE(`oguild_id`,`skill_type`,`skill_name`)
);
--> statement-breakpoint
CREATE TABLE `guild_members` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`oguild_id` varchar(64) NOT NULL,
	`character_name` varchar(50) NOT NULL,
	`ocid` varchar(64),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guild_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `guild_skills` ADD CONSTRAINT `guild_skills_oguild_id_guilds_oguild_id_fk` FOREIGN KEY (`oguild_id`) REFERENCES `guilds`(`oguild_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_oguild_id_guilds_oguild_id_fk` FOREIGN KEY (`oguild_id`) REFERENCES `guilds`(`oguild_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_guild_name_world` ON `guilds` (`guild_name`,`world_name`);--> statement-breakpoint
CREATE INDEX `idx_guild_member_oguild` ON `guild_members` (`oguild_id`);--> statement-breakpoint
CREATE INDEX `idx_guild_member_ocid` ON `guild_members` (`ocid`);
