-- Add per-user default album support for existing databases.
ALTER TABLE "Album"
ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Remove the old per-user title uniqueness if it exists.
ALTER TABLE "Album"
DROP CONSTRAINT IF EXISTS "Album_userId_title_key";

DROP INDEX IF EXISTS "Album_userId_title_key";

-- Keep default-album lookups efficient.
CREATE INDEX IF NOT EXISTS "Album_userId_isDefault_idx"
ON "Album"("userId", "isDefault");

-- Enforce one default album per user.
CREATE UNIQUE INDEX IF NOT EXISTS "Album_one_default_per_user"
ON "Album"("userId")
WHERE "isDefault" = true;
