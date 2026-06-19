ALTER TABLE generations ADD COLUMN teamId TEXT REFERENCES teams(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS generations_teamId_createdAt_idx ON generations(teamId, createdAt);
