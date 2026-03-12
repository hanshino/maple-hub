CREATE TABLE `character_union_raider_stats` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`stat_value` varchar(100) NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_raider_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_link_skills` ADD `skill_icon` varchar(255);--> statement-breakpoint
ALTER TABLE `character_union_raider_stats` ADD CONSTRAINT `character_union_raider_stats_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_raider_stats` (`ocid`);