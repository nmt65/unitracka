ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "emailVerificationCodeHash" varchar(128),
  ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "emailVerificationAttempts" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "passkeyChallenge" text,
  ADD COLUMN IF NOT EXISTS "passkeyChallengeType" varchar(24),
  ADD COLUMN IF NOT EXISTS "passkeyChallengeExpiresAt" timestamptz;

-- Conturile create înaintea introducerii verificării emailului rămân active.
UPDATE "Users"
SET "emailVerifiedAt" = COALESCE("createdAt", now())
WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "Passkeys" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "credentialId" text NOT NULL UNIQUE,
  "publicKey" text NOT NULL,
  "webauthnUserId" text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  "deviceType" varchar(32),
  "backedUp" boolean NOT NULL DEFAULT false,
  transports text NOT NULL DEFAULT '[]',
  name varchar(100) NOT NULL DEFAULT 'Passkey personal',
  "lastUsedAt" timestamptz,
  "UserId" uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS passkeys_credential_id_unique
  ON "Passkeys"("credentialId");
CREATE INDEX IF NOT EXISTS passkeys_user_id_idx
  ON "Passkeys"("UserId");

DROP TRIGGER IF EXISTS passkeys_set_updated_at ON "Passkeys";
CREATE TRIGGER passkeys_set_updated_at BEFORE UPDATE ON "Passkeys"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE "Passkeys" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS passkeys_owner_read ON "Passkeys";
DROP POLICY IF EXISTS passkeys_owner_insert ON "Passkeys";
DROP POLICY IF EXISTS passkeys_owner_update ON "Passkeys";
DROP POLICY IF EXISTS passkeys_owner_delete ON "Passkeys";

CREATE POLICY passkeys_owner_read
  ON "Passkeys"
  FOR SELECT
  USING (app.current_user_role() = 'admin' OR "UserId" = app.current_user_id());

CREATE POLICY passkeys_owner_insert
  ON "Passkeys"
  FOR INSERT
  WITH CHECK (app.current_user_role() = 'admin' OR "UserId" = app.current_user_id());

CREATE POLICY passkeys_owner_update
  ON "Passkeys"
  FOR UPDATE
  USING (app.current_user_role() = 'admin' OR "UserId" = app.current_user_id())
  WITH CHECK (app.current_user_role() = 'admin' OR "UserId" = app.current_user_id());

CREATE POLICY passkeys_owner_delete
  ON "Passkeys"
  FOR DELETE
  USING (app.current_user_role() = 'admin' OR "UserId" = app.current_user_id());
