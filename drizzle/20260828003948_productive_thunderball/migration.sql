ALTER TABLE `attendance` ADD `attendance_type` enum('Present','Leave','Permission','Unpaid Leave') DEFAULT 'Present' NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `check_in_time` varchar(20);--> statement-breakpoint
ALTER TABLE `attendance` ADD `check_out_time` varchar(20);--> statement-breakpoint
ALTER TABLE `attendance` ADD `check_in_location` enum('Main Building','Building A','Building B');--> statement-breakpoint
ALTER TABLE `attendance` ADD `check_out_location` enum('Main Building','Building A','Building B');--> statement-breakpoint
ALTER TABLE `attendance` ADD `effective_working_hours` decimal(5,1) DEFAULT (0.0) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `status` enum('Fulfilled','Not Fulfilled') DEFAULT 'Not Fulfilled' NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `verification` enum('Approved','Rejected') DEFAULT 'Approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `verifier` enum('Lead','Manager','HRD') DEFAULT 'Lead' NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `updated_at` timestamp(3) DEFAULT (CURRENT_TIMESTAMP(3)) NOT NULL;--> statement-breakpoint
CREATE INDEX `attendance_status_idx` ON `attendance` (`status`);