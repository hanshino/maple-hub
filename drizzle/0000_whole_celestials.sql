CREATE TABLE `character_cash_equipment` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`cash_item_name` varchar(200),
	`cash_item_icon` text,
	`cash_item_equipment_slot` varchar(20),
	`cash_item_option` json,
	`date_expire` timestamp,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_cash_equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_equipment` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`preset_no` tinyint NOT NULL,
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
	CONSTRAINT `character_equipment_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_preset_slot` UNIQUE(`ocid`,`preset_no`,`item_equipment_slot`)
);
--> statement-breakpoint
CREATE TABLE `character_hexa_cores` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`hexa_core_name` varchar(100) NOT NULL,
	`hexa_core_level` int DEFAULT 0,
	`hexa_core_type` varchar(20),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_hexa_cores_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_core` UNIQUE(`ocid`,`hexa_core_name`)
);
--> statement-breakpoint
CREATE TABLE `character_hexa_stats` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`slot_id` varchar(10) NOT NULL,
	`main_stat_name` varchar(50),
	`sub_stat_name_1` varchar(50),
	`sub_stat_name_2` varchar(50),
	`main_stat_level` int DEFAULT 0,
	`sub_stat_level_1` int DEFAULT 0,
	`sub_stat_level_2` int DEFAULT 0,
	`stat_grade` int DEFAULT 0,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_hexa_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_slot` UNIQUE(`ocid`,`slot_id`)
);
--> statement-breakpoint
CREATE TABLE `character_hyper_stat_presets` (
	`ocid` varchar(64) NOT NULL,
	`use_preset_no` tinyint NOT NULL DEFAULT 1,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_hyper_stat_presets_ocid` PRIMARY KEY(`ocid`)
);
--> statement-breakpoint
CREATE TABLE `character_hyper_stats` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`preset_no` tinyint NOT NULL,
	`stat_type` varchar(20) NOT NULL,
	`stat_level` int DEFAULT 0,
	`stat_increase` varchar(100),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_hyper_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_preset_type` UNIQUE(`ocid`,`preset_no`,`stat_type`)
);
--> statement-breakpoint
CREATE TABLE `character_link_skill_presets` (
	`ocid` varchar(64) NOT NULL,
	`use_preset_no` tinyint NOT NULL DEFAULT 1,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_link_skill_presets_ocid` PRIMARY KEY(`ocid`)
);
--> statement-breakpoint
CREATE TABLE `character_link_skills` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`preset_no` tinyint NOT NULL,
	`skill_name` varchar(100) NOT NULL,
	`skill_description` text,
	`skill_effect` text,
	`skill_level` int,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_link_skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_preset_skill` UNIQUE(`ocid`,`preset_no`,`skill_name`)
);
--> statement-breakpoint
CREATE TABLE `character_pet_equipment` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`pet_name` varchar(100),
	`pet_icon` text,
	`pet_equipment_slot` varchar(20),
	`pet_total_option` json,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_pet_equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_set_effects` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`set_name` varchar(100) NOT NULL,
	`set_level` int DEFAULT 0,
	`set_effect_level` int DEFAULT 0,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_set_effects_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_set` UNIQUE(`ocid`,`set_name`)
);
--> statement-breakpoint
CREATE TABLE `character_stats` (
	`ocid` varchar(64) NOT NULL,
	`str` int,
	`dex` int,
	`int_stat` int,
	`luk` int,
	`attack_power` int,
	`magic_power` int,
	`boss_damage` decimal(6,2),
	`critical_damage` decimal(6,2),
	`ignore_defense` decimal(6,2),
	`damage` decimal(6,2),
	`final_damage` decimal(6,2),
	`all_stats` json,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_stats_ocid` PRIMARY KEY(`ocid`)
);
--> statement-breakpoint
CREATE TABLE `character_symbols` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`symbol_name` varchar(100) NOT NULL,
	`symbol_icon` text,
	`symbol_level` int DEFAULT 0,
	`symbol_force` int DEFAULT 0,
	`symbol_growth_count` int DEFAULT 0,
	`symbol_require_growth_count` int DEFAULT 0,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_symbols_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_ocid_symbol` UNIQUE(`ocid`,`symbol_name`)
);
--> statement-breakpoint
CREATE TABLE `character_union` (
	`ocid` varchar(64) NOT NULL,
	`union_level` int,
	`union_grade` varchar(50),
	`union_artifact_level` int,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_ocid` PRIMARY KEY(`ocid`)
);
--> statement-breakpoint
CREATE TABLE `character_union_artifacts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ocid` varchar(64) NOT NULL,
	`crystal_name` varchar(100),
	`crystal_level` int,
	`crystal_type` varchar(50),
	`is_primary` boolean DEFAULT false,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_union_artifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`ocid` varchar(64) NOT NULL,
	`character_name` varchar(100),
	`character_level` int,
	`character_class` varchar(50),
	`world_name` varchar(50),
	`character_image` text,
	`character_exp_rate` decimal(10,6),
	`character_gender` varchar(10),
	`character_guild_name` varchar(100),
	`combat_power` bigint,
	`status` enum('success','not_found','error') DEFAULT 'success',
	`not_found_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characters_ocid` PRIMARY KEY(`ocid`)
);
--> statement-breakpoint
ALTER TABLE `character_cash_equipment` ADD CONSTRAINT `character_cash_equipment_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_equipment` ADD CONSTRAINT `character_equipment_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_hexa_cores` ADD CONSTRAINT `character_hexa_cores_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_hexa_stats` ADD CONSTRAINT `character_hexa_stats_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_hyper_stat_presets` ADD CONSTRAINT `character_hyper_stat_presets_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_hyper_stats` ADD CONSTRAINT `character_hyper_stats_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_link_skill_presets` ADD CONSTRAINT `character_link_skill_presets_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_link_skills` ADD CONSTRAINT `character_link_skills_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_pet_equipment` ADD CONSTRAINT `character_pet_equipment_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_set_effects` ADD CONSTRAINT `character_set_effects_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_stats` ADD CONSTRAINT `character_stats_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_symbols` ADD CONSTRAINT `character_symbols_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_union` ADD CONSTRAINT `character_union_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_union_artifacts` ADD CONSTRAINT `character_union_artifacts_ocid_characters_ocid_fk` FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_cash_equipment` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_equipment` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_potential_grade` ON `character_equipment` (`potential_option_grade`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_hexa_cores` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_hexa_stats` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_hyper_stats` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_link_skills` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_pet_equipment` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_set_effects` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_symbols` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_ocid` ON `character_union_artifacts` (`ocid`);--> statement-breakpoint
CREATE INDEX `idx_world_class` ON `characters` (`world_name`,`character_class`);--> statement-breakpoint
CREATE INDEX `idx_combat_power` ON `characters` (`combat_power`);--> statement-breakpoint
CREATE INDEX `idx_name` ON `characters` (`character_name`);