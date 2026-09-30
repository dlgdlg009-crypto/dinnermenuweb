CREATE TABLE IF NOT EXISTS dinner_comments (
  id TEXT PRIMARY KEY NOT NULL,
  visitor_id TEXT NOT NULL CHECK (length(visitor_id) = 36),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dinner_comments_created
  ON dinner_comments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dinner_comments_visitor_created
  ON dinner_comments (visitor_id, created_at DESC);
