CREATE TABLE `audit_log` (
	`id` varchar(36) PRIMARY KEY,
	`user_id` varchar(36),
	`user_name` varchar(255) NOT NULL,
	`module` varchar(255) NOT NULL,
	`action` enum('CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
	`resource_id` varchar(255),
	`description` text,
	`ip_address` text,
	`user_agent` text,
	`metadata` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `audit_log_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
CREATE INDEX `audit_log_user_id_idx` ON `audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_log_module_idx` ON `audit_log` (`module`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `audit_log_created_at_idx` ON `audit_log` (`created_at`);