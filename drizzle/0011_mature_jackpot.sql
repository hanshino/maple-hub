CREATE TABLE `character_equipment_presets` (
	`ocid` varchar(64) NOT NULL,
	`active_preset_no` tinyint NOT NULL DEFAULT 1,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_equipment_presets_ocid` PRIMARY KEY(`ocid`)
);
--> statement-breakpoint
ALTER TABLE `character_link_skill_presets` ADD `owned_link_skill` json;--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_nickname` varchar(100);--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_description` text;--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_type` varchar(100);--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_auto_skill` json;--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_skill` json;--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_date_expire` datetime;--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_appearance` varchar(100);--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD `pet_appearance_icon` text;--> statement-breakpoint
ALTER TABLE `character_equipment_presets` ADD CONSTRAINT `character_equipment_presets_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;