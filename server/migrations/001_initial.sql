CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS footprint_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  transport_km REAL NOT NULL DEFAULT 0,
  transport_mode TEXT NOT NULL,
  electricity_kwh REAL NOT NULL DEFAULT 0,
  gas_kwh REAL NOT NULL DEFAULT 0,
  diet_type TEXT NOT NULL,
  meals INTEGER NOT NULL DEFAULT 0,
  purchases_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  total_kg REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_footprint_user_date
  ON footprint_entries(user_id, entry_date DESC);

CREATE TABLE IF NOT EXISTS eco_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action_date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_savings_kg REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_actions_user_date
  ON eco_actions(user_id, action_date DESC);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  achieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
