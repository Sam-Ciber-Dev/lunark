CREATE TABLE `verification_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`expires_at` text NOT NULL,
	`pending_name` text,
	`pending_password_hash` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
DROP INDEX `categories_name_unique`;--> statement-breakpoint
ALTER TABLE `categories` ADD `parent_id` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `products` ADD `color` text;--> statement-breakpoint
ALTER TABLE `products` ADD `material` text;--> statement-breakpoint
ALTER TABLE `products` ADD `design_type` text;--> statement-breakpoint
ALTER TABLE `products` ADD `style` text;--> statement-breakpoint
ALTER TABLE `products` ADD `length` text;--> statement-breakpoint
ALTER TABLE `products` ADD `sleeve_length` text;--> statement-breakpoint
ALTER TABLE `products` ADD `fit` text;--> statement-breakpoint
ALTER TABLE `products` ADD `composition` text;--> statement-breakpoint
ALTER TABLE `products` ADD `details` text;--> statement-breakpoint
ALTER TABLE `products` ADD `fabric_elasticity` text;--> statement-breakpoint
ALTER TABLE `products` ADD `age_group` text;--> statement-breakpoint
ALTER TABLE `products` ADD `sales_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer DEFAULT false NOT NULL;