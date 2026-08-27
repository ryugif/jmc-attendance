CREATE TABLE `employee` (
	`id` varchar(36) PRIMARY KEY,
	`nip` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone_number` varchar(50) NOT NULL,
	`photo_url` text,
	`place_of_birth` varchar(255) NOT NULL,
	`district_id` varchar(36),
	`district_name` varchar(255) NOT NULL,
	`regency_id` varchar(36),
	`regency_name` varchar(255) NOT NULL,
	`province_id` varchar(36),
	`province_name` varchar(255) NOT NULL,
	`full_address` text NOT NULL,
	`home_to_office_distance` int NOT NULL,
	`date_of_birth` date NOT NULL,
	`age` int NOT NULL,
	`marital_status` enum('Married','Not Married') NOT NULL,
	`number_of_children` int NOT NULL DEFAULT 0,
	`join_date` date NOT NULL,
	`position` enum('Manager','Staff','Intern') NOT NULL,
	`department_id` varchar(36),
	`contract_status` enum('Permanent','Contract','Internship','Probation') NOT NULL DEFAULT 'Permanent',
	`status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `nip_unique` UNIQUE INDEX(`nip`)
);
--> statement-breakpoint
CREATE TABLE `employee_education` (
	`id` varchar(36) PRIMARY KEY,
	`employee_id` varchar(36) NOT NULL,
	`level` varchar(100) NOT NULL,
	`school_name` varchar(255) NOT NULL,
	`graduation_year` int NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE INDEX `employee_name_idx` ON `employee` (`name`);--> statement-breakpoint
CREATE INDEX `employee_nip_idx` ON `employee` (`nip`);--> statement-breakpoint
CREATE INDEX `employee_department_id_idx` ON `employee` (`department_id`);--> statement-breakpoint
CREATE INDEX `employee_status_idx` ON `employee` (`status`);--> statement-breakpoint
CREATE INDEX `employee_education_employee_id_idx` ON `employee_education` (`employee_id`);--> statement-breakpoint
ALTER TABLE `employee` ADD CONSTRAINT `employee_district_id_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `district`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `employee` ADD CONSTRAINT `employee_regency_id_regency_id_fkey` FOREIGN KEY (`regency_id`) REFERENCES `regency`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `employee` ADD CONSTRAINT `employee_province_id_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `province`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `employee` ADD CONSTRAINT `employee_department_id_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `employee_education` ADD CONSTRAINT `employee_education_employee_id_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE CASCADE;