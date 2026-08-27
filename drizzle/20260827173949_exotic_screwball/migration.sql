CREATE TABLE `account` (
	`id` varchar(36) PRIMARY KEY,
	`issuer` varchar(191) NOT NULL,
	`account_id` varchar(191) NOT NULL,
	`provider_id` varchar(191) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `account_issuer_accountId_uidx` UNIQUE INDEX(`issuer`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `role` (
	`id` varchar(36) PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `name_unique` UNIQUE INDEX(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_permission` (
	`id` varchar(36) PRIMARY KEY,
	`role_id` varchar(36) NOT NULL,
	`module_name` varchar(255) NOT NULL,
	`access` boolean NOT NULL DEFAULT false,
	`create` boolean NOT NULL DEFAULT false,
	`read` enum('all','own','no') NOT NULL DEFAULT 'no',
	`update` enum('all','own','no') NOT NULL DEFAULT 'no',
	`delete` enum('all','own','no') NOT NULL DEFAULT 'no',
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `role_permission_role_module_uidx` UNIQUE INDEX(`role_id`,`module_name`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) PRIMARY KEY,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`impersonated_by` varchar(255),
	CONSTRAINT `token_unique` UNIQUE INDEX(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`username` varchar(255) NOT NULL,
	`image` text,
	`phone_number` varchar(255),
	`phone_number_verified` boolean NOT NULL DEFAULT false,
	`role` varchar(255) NOT NULL DEFAULT 'user',
	`banned` boolean NOT NULL DEFAULT false,
	`ban_reason` text,
	`ban_expires` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `email_unique` UNIQUE INDEX(`email`),
	CONSTRAINT `username_unique` UNIQUE INDEX(`username`),
	CONSTRAINT `user_phoneNumber_uidx` UNIQUE INDEX(`phone_number`)
);
--> statement-breakpoint
CREATE TABLE `user_role` (
	`id` varchar(36) PRIMARY KEY,
	`user_id` varchar(36) NOT NULL,
	`role_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `user_role_user_role_uidx` UNIQUE INDEX(`user_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) PRIMARY KEY,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3))
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `role_name_idx` ON `role` (`name`);--> statement-breakpoint
CREATE INDEX `role_permission_role_id_idx` ON `role_permission` (`role_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_role_user_id_idx` ON `user_role` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_role_role_id_idx` ON `user_role` (`role_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `role_permission` ADD CONSTRAINT `role_permission_role_id_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_role_id_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE;