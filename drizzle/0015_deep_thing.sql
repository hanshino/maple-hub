CREATE TABLE `character_abilities` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`preset_no` int NOT NULL,
	`ability_no` varchar(10),
	`ability_grade` varchar(20),
	`ability_value` varchar(200),
	`preset_grade` varchar(20),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_abilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_ability_meta` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`active_preset_no` int,
	`ability_grade` varchar(20),
	`remain_fame` bigint,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_ability_meta_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid` UNIQUE(`ocid`)
);
--> statement-breakpoint
ALTER TABLE `character_abilities` ADD CONSTRAINT `character_abilities_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_ability_meta` ADD CONSTRAINT `character_ability_meta_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_abilities` (`ocid`);