CREATE TABLE IF NOT EXISTS menu_reactions (
  menu_name TEXT NOT NULL CHECK (length(menu_name) BETWEEN 1 AND 64),
  voter_id TEXT NOT NULL CHECK (length(voter_id) = 36),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (menu_name, voter_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_menu_reactions_voter
  ON menu_reactions (voter_id, menu_name);
