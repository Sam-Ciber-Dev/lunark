CREATE TABLE `newsletter_banned_emails` (
	`email` text PRIMARY KEY NOT NULL,
	`reason` text,
	`banned_at` text DEFAULT (datetime('now')) NOT NULL
);
