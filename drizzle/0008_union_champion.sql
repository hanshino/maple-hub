CREATE TABLE `character_union_champion` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`champion_slot` int NOT NULL,
	`champion_name` varchar(100),
	`champion_grade` varchar(10),
	`champion_class` varchar(50),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_champion_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_union_champion_badges` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`champion_slot` int,
	`stat` varchar(255) NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_champion_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_union_champion` ADD CONSTRAINT `character_union_champion_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_union_champion_badges` ADD CONSTRAINT `character_union_champion_badges_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_champion` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_champion_badges` (`ocid`);
