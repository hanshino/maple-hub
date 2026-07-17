CREATE TABLE `character_current_equipment` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`source_ordinal` int NOT NULL,
	`item_equipment_slot` varchar(20) NOT NULL,
	`item_equipment_part` varchar(50),
	`item_name` varchar(100),
	`item_icon` text,
	`item_level` int,
	`starforce` int DEFAULT 0,
	`scroll_upgrade` int DEFAULT 0,
	`potential_option_grade` varchar(20),
	`potential_option_1` varchar(200),
	`potential_option_2` varchar(200),
	`potential_option_3` varchar(200),
	`additional_potential_option_grade` varchar(20),
	`additional_potential_option_1` varchar(200),
	`additional_potential_option_2` varchar(200),
	`additional_potential_option_3` varchar(200),
	`item_total_option` json,
	`item_base_option` json,
	`item_starforce_option` json,
	`item_add_option` json,
	`item_etc_option` json,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_current_equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_current_equipment` ADD CONSTRAINT `character_current_equipment_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_current_equipment_ocid` ON `character_current_equipment` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_current_equipment_ocid_ordinal` ON `character_current_equipment` (`ocid`,`source_ordinal`);--> statement-breakpoint
ALTER TABLE `character_equipment_presets` ADD `has_current_equipment_snapshot` tinyint DEFAULT 0 NOT NULL;