CREATE TABLE `attendance` (
	`id` varchar(36) PRIMARY KEY,
	`employee_id` varchar(36) NOT NULL,
	`attendance_date` date NOT NULL,
	`is_present` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `attendance_employee_date_uidx` UNIQUE INDEX(`employee_id`,`attendance_date`)
);
--> statement-breakpoint
CREATE TABLE `transport_allowance_result` (
	`id` varchar(36) PRIMARY KEY,
	`employee_id` varchar(36) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`base_fare` int NOT NULL,
	`rounded_distance` decimal(10,2) NOT NULL,
	`eligible_distance` decimal(10,2) NOT NULL,
	`working_days` int NOT NULL,
	`amount` int NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `transport_allowance_result_employee_year_month_uidx` UNIQUE INDEX(`employee_id`,`year`,`month`)
);
--> statement-breakpoint
CREATE TABLE `transport_allowance_setting` (
	`id` varchar(36) PRIMARY KEY,
	`base_fare` int NOT NULL,
	`min_distance` decimal(10,2) NOT NULL,
	`max_distance` decimal(10,2) NOT NULL,
	`effective_from` date NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE INDEX `attendance_employee_id_idx` ON `attendance` (`employee_id`);--> statement-breakpoint
CREATE INDEX `transport_allowance_result_employee_idx` ON `transport_allowance_result` (`employee_id`);--> statement-breakpoint
CREATE INDEX `transport_allowance_result_year_month_idx` ON `transport_allowance_result` (`year`,`month`);--> statement-breakpoint
CREATE INDEX `transport_allowance_setting_effective_from_idx` ON `transport_allowance_setting` (`effective_from`);--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `transport_allowance_result` ADD CONSTRAINT `transport_allowance_result_employee_id_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE CASCADE;