-- Migration: Add processing stage fields to generations table
-- Created at: 2026-03-08

-- Add processingStage column
ALTER TABLE generations ADD COLUMN processingStage TEXT;

-- Add stageStartedAt column
ALTER TABLE generations ADD COLUMN stageStartedAt INTEGER;

-- Create index for status and stageStartedAt (if not exists)
CREATE INDEX IF NOT EXISTS generations_status_stageStartedAt_idx ON generations(status, stageStartedAt);
