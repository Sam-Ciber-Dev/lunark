CREATE TABLE `newsletter_subscribers` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `locale` text DEFAULT 'pt' NOT NULL,
  `unsubscribed_at` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
  `id` text PRIMARY KEY NOT NULL,
  `sender_name` text NOT NULL,
  `sender_email` text NOT NULL,
  `subject` text NOT NULL,
  `preview` text NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `unread` integer DEFAULT 1 NOT NULL,
  `user_id` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_support_tickets_created_at` ON `support_tickets` (`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_support_tickets_status` ON `support_tickets` (`status`);
--> statement-breakpoint
CREATE TABLE `support_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `ticket_id` text NOT NULL,
  `author_role` text NOT NULL,
  `author_name` text NOT NULL,
  `body` text NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_support_messages_ticket_id` ON `support_messages` (`ticket_id`);
