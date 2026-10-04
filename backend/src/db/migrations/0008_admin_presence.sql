CREATE TABLE IF NOT EXISTS traffic_admin_presence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  ip TEXT NOT NULL,
  connected_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_online INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_traffic_admin_presence_last_seen
  ON traffic_admin_presence(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_traffic_admin_presence_user_fp
  ON traffic_admin_presence(user_id, fingerprint_hash);
