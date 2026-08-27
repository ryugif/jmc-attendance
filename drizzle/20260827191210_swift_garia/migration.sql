CREATE TABLE `department` (
	`id` varchar(36) PRIMARY KEY,
	`code` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE TABLE `district` (
	`id` varchar(36) PRIMARY KEY,
	`code` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`regency_id` varchar(36) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE TABLE `job_position` (
	`id` varchar(36) PRIMARY KEY,
	`code` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`department_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE TABLE `province` (
	`id` varchar(36) PRIMARY KEY,
	`code` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE TABLE `regency` (
	`id` varchar(36) PRIMARY KEY,
	`code` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`province_id` varchar(36) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE INDEX `department_name_idx` ON `department` (`name`);--> statement-breakpoint
CREATE INDEX `district_regency_id_idx` ON `district` (`regency_id`);--> statement-breakpoint
CREATE INDEX `district_name_idx` ON `district` (`name`);--> statement-breakpoint
CREATE INDEX `job_position_department_id_idx` ON `job_position` (`department_id`);--> statement-breakpoint
CREATE INDEX `job_position_name_idx` ON `job_position` (`name`);--> statement-breakpoint
CREATE INDEX `province_name_idx` ON `province` (`name`);--> statement-breakpoint
CREATE INDEX `regency_province_id_idx` ON `regency` (`province_id`);--> statement-breakpoint
CREATE INDEX `regency_name_idx` ON `regency` (`name`);--> statement-breakpoint
ALTER TABLE `district` ADD CONSTRAINT `district_regency_id_regency_id_fkey` FOREIGN KEY (`regency_id`) REFERENCES `regency`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `job_position` ADD CONSTRAINT `job_position_department_id_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `regency` ADD CONSTRAINT `regency_province_id_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `province`(`id`) ON DELETE CASCADE;