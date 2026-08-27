ALTER TABLE `user` ADD `department_id` varchar(36);--> statement-breakpoint
ALTER TABLE `user` ADD `job_position_id` varchar(36);--> statement-breakpoint
ALTER TABLE `user` ADD `employee_code` varchar(50);--> statement-breakpoint
ALTER TABLE `user` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `user_department_id_idx` ON `user` (`department_id`);--> statement-breakpoint
CREATE INDEX `user_job_position_id_idx` ON `user` (`job_position_id`);--> statement-breakpoint
CREATE INDEX `user_role_id_idx` ON `user` (`role_id`);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_department_id_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_job_position_id_job_position_id_fkey` FOREIGN KEY (`job_position_id`) REFERENCES `job_position`(`id`) ON DELETE SET NULL;