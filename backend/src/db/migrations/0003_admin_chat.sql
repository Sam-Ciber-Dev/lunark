CREATE TABLE `admin_chat_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `author_id` text,
  `author_role` text NOT NULL,
  `author_name` text NOT NULL,
  `author_image` text,
  `content` text NOT NULL,
  `attachments` text,
  `reply_to` text,
  `edited_at` text,
  `deleted_at` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_admin_chat_messages_created_at` ON `admin_chat_messages` (`created_at`);
