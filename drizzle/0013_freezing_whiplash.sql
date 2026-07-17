CREATE TABLE `character_familiars` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`familiar_name` varchar(100),
	`familiar_level` int DEFAULT 0,
	`option_level` int DEFAULT 0,
	`familiar_grade` varchar(50),
	`familiar_state` varchar(20),
	`slot_id` varchar(20),
	`special_flag` tinyint DEFAULT 0,
	`familiar_option` json,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_familiars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_familiars` ADD CONSTRAINT `character_familiars_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_familiars` (`ocid`);