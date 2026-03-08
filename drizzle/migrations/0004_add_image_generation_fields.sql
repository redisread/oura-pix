-- Migration: Add generation fields to images table
-- Created at: 2026-03-08

-- Add generationId column (for generated_scene type images)
ALTER TABLE images ADD COLUMN generationId TEXT;

-- Add promptUsed column (for storing generation prompt)
ALTER TABLE images ADD COLUMN promptUsed TEXT;
