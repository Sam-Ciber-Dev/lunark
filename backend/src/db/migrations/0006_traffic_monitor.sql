-- Painel de Segurança — EyeWeb-style traffic monitor tables

CREATE TABLE `traffic_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ip` text NOT NULL,
  `method` text NOT NULL,
  `path` text NOT NULL,
  `status_code` integer DEFAULT 0 NOT NULL,
  `user_agent` text DEFAULT '' NOT NULL,
  `country` text DEFAULT '' NOT NULL,
  `city` text DEFAULT '' NOT NULL,
  `is_vpn` integer DEFAULT 0 NOT NULL,
  `vpn_provider` text DEFAULT '' NOT NULL,
  `response_time_ms` integer DEFAULT 0 NOT NULL,
  `fingerprint_hash` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
CREATE INDEX `traffic_logs_created_at_idx` ON `traffic_logs` (`created_at`);
CREATE INDEX `traffic_logs_ip_idx` ON `traffic_logs` (`ip`);
CREATE INDEX `traffic_logs_fp_idx` ON `traffic_logs` (`fingerprint_hash`);

CREATE TABLE `traffic_suspicious` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ip` text NOT NULL,
  `event` text NOT NULL,
  `severity` text DEFAULT 'low' NOT NULL,
  `details` text DEFAULT '' NOT NULL,
  `path` text DEFAULT '' NOT NULL,
  `country` text DEFAULT '' NOT NULL,
  `city` text DEFAULT '' NOT NULL,
  `is_vpn` integer DEFAULT 0 NOT NULL,
  `fingerprint_hash` text DEFAULT '' NOT NULL,
  `auto_blocked` integer DEFAULT 0 NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
CREATE INDEX `traffic_suspicious_created_at_idx` ON `traffic_suspicious` (`created_at`);
CREATE INDEX `traffic_suspicious_ip_idx` ON `traffic_suspicious` (`ip`);

CREATE TABLE `traffic_blocked_ips` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ip` text NOT NULL UNIQUE,
  `reason` text DEFAULT '' NOT NULL,
  `blocked_by` text DEFAULT 'admin' NOT NULL,
  `request_count` integer DEFAULT 0 NOT NULL,
  `country` text DEFAULT '' NOT NULL,
  `is_vpn` integer DEFAULT 0 NOT NULL,
  `log_snapshot` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `traffic_blocked_devices` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `fingerprint_hash` text NOT NULL UNIQUE,
  `reason` text DEFAULT '' NOT NULL,
  `blocked_by` text DEFAULT 'admin' NOT NULL,
  `components` text DEFAULT '{}' NOT NULL,
  `associated_ips` text DEFAULT '[]' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `traffic_device_ips` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `fingerprint_hash` text NOT NULL,
  `ip` text NOT NULL,
  `is_vpn` integer DEFAULT 0 NOT NULL,
  `first_seen_at` text DEFAULT (datetime('now')) NOT NULL,
  `last_seen_at` text DEFAULT (datetime('now')) NOT NULL
);
CREATE INDEX `traffic_device_ips_fp_idx` ON `traffic_device_ips` (`fingerprint_hash`);
CREATE INDEX `traffic_device_ips_ip_idx` ON `traffic_device_ips` (`ip`);
CREATE UNIQUE INDEX `traffic_device_ips_fp_ip_idx` ON `traffic_device_ips` (`fingerprint_hash`, `ip`);

CREATE TABLE `traffic_vpn_cache` (
  `ip` text PRIMARY KEY NOT NULL,
  `is_vpn` integer DEFAULT 0 NOT NULL,
  `provider` text DEFAULT '' NOT NULL,
  `country` text DEFAULT '' NOT NULL,
  `city` text DEFAULT '' NOT NULL,
  `cached_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `traffic_reports` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `type` text NOT NULL,
  `period` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `markdown` text DEFAULT '' NOT NULL,
  `data` text DEFAULT '{}' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
