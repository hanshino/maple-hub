CREATE TABLE `character_union_artifact_effects` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`effect_name` varchar(100) NOT NULL,
	`effect_level` int,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_artifact_effects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_union_artifacts` ADD `crystal_option_name_1` varchar(100);--> statement-breakpoint
ALTER TABLE `character_union_artifacts` ADD `crystal_option_name_2` varchar(100);--> statement-breakpoint
ALTER TABLE `character_union_artifacts` ADD `crystal_option_name_3` varchar(100);--> statement-breakpoint
ALTER TABLE `character_union_artifacts` DROP COLUMN `crystal_type`;--> statement-breakpoint
ALTER TABLE `character_union_artifacts` DROP COLUMN `is_primary`;--> statement-breakpoint
ALTER TABLE `character_union_artifact_effects` ADD CONSTRAINT `character_union_artifact_effects_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_artifact_effects` (`ocid`);
