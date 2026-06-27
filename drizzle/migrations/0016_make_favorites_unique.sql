-- Enforce the intended unique favorite constraint.
-- Existing duplicate favorite rows are redundant; keep one row per user/image pair.

DELETE FROM favorites
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM favorites
  GROUP BY userId, imageUrl
);

DROP INDEX IF EXISTS favorites_unique_idx;

CREATE UNIQUE INDEX favorites_unique_idx ON favorites(userId, imageUrl);
