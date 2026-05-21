ALTER TABLE "Documents"
ADD COLUMN IF NOT EXISTS "fileSize" integer,
ADD COLUMN IF NOT EXISTS "fileDataUrl" text;

