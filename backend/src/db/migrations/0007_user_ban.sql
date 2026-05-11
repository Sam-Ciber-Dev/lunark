-- Add account-ban columns to users table.
ALTER TABLE `users` ADD COLUMN `is_banned` integer DEFAULT 0 NOT NULL;
ALTER TABLE `users` ADD COLUMN `banned_at` text;
ALTER TABLE `users` ADD COLUMN `ban_reason` text;

-- Wipe traffic_vpn_cache so existing IPs get re-classified by the new
-- ISP / ASN heuristic on their next request.
DELETE FROM `traffic_vpn_cache`;
