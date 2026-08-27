ALTER TABLE `user` ADD `role_id` varchar(36);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_role_id_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `role`;