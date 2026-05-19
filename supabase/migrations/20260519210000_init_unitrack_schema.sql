CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS "Users" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(180) NOT NULL UNIQUE,
  "passwordHash" varchar(255) NOT NULL,
  name varchar(120) DEFAULT 'Student UniTrack',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'university', 'admin')),
  "cnpHash" varchar(128) UNIQUE,
  "cnpLast4" varchar(4),
  "bacAverage" double precision,
  "languageResults" text DEFAULT '',
  interests text DEFAULT '[]',
  "emailNotifications" boolean DEFAULT true,
  "notifyBeforeDays" integer DEFAULT 14,
  "publicShareId" uuid DEFAULT gen_random_uuid(),
  "resetTokenHash" varchar(128),
  "resetTokenExpiresAt" timestamptz,
  "passwordChangedAt" timestamptz,
  "lastLoginAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Institutions" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL UNIQUE,
  "shortName" varchar(20) NOT NULL,
  country varchar(120) NOT NULL DEFAULT 'România',
  "countryCode" varchar(8) DEFAULT 'RO',
  city varchar(120),
  website varchar(500),
  "contactEmail" varchar(180),
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'disabled')),
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "InstitutionId" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Users_InstitutionId_fkey'
  ) THEN
    ALTER TABLE "Users"
    ADD CONSTRAINT "Users_InstitutionId_fkey"
    FOREIGN KEY ("InstitutionId")
    REFERENCES "Institutions"(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS users_institution_id_idx ON "Users"("InstitutionId");

CREATE TABLE IF NOT EXISTS "Universities" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  "shortName" varchar(20),
  country varchar(120) NOT NULL,
  "countryCode" varchar(8),
  faculty varchar(180) NOT NULL,
  program varchar(180) NOT NULL,
  "programType" text DEFAULT 'licenta' CHECK ("programType" IN ('licenta', 'master', 'doctorat')),
  deadline date NOT NULL,
  "officialLink" varchar(500),
  notes text,
  status text DEFAULT 'Wishlist' CHECK (status IN ('Wishlist', 'Cercetare', 'Aplicat', 'Acceptat', 'Respins')),
  "annualTuition" double precision,
  rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 10),
  "UserId" uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AdmissionApplications" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program varchar(180) NOT NULL,
  faculty varchar(180),
  "programType" text DEFAULT 'licenta' CHECK ("programType" IN ('licenta', 'master', 'doctorat')),
  status text DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlist')),
  "admissionScore" double precision,
  notes text,
  "reviewerNotes" text,
  "submittedAt" timestamptz DEFAULT now(),
  "reviewedAt" timestamptz,
  "InstitutionId" uuid NOT NULL REFERENCES "Institutions"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "StudentId" uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_student_institution_program_unique UNIQUE ("StudentId", "InstitutionId", program)
);

CREATE TABLE IF NOT EXISTS "Documents" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  category varchar(80) DEFAULT 'Custom',
  "isOptional" boolean DEFAULT false,
  "isCompleted" boolean DEFAULT false,
  "completedAt" date,
  "fileName" varchar(240),
  "mimeType" varchar(120),
  "fileSha256" varchar(64),
  "extractedText" text,
  "verificationStatus" text DEFAULT 'missing' CHECK ("verificationStatus" IN ('missing', 'pending', 'verified', 'rejected')),
  "aiProvider" varchar(40),
  "aiLabel" varchar(120),
  "aiConfidence" double precision,
  "aiExplanation" text,
  "UniversityId" uuid REFERENCES "Universities"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "AdmissionApplicationId" uuid REFERENCES "AdmissionApplications"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Notifications" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(180) NOT NULL,
  body text NOT NULL,
  type varchar(60) DEFAULT 'system',
  "readAt" timestamptz,
  "UserId" uuid NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "AdmissionApplicationId" uuid REFERENCES "AdmissionApplications"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AuditLogs" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorEmail" varchar(180),
  "actorRole" varchar(40),
  action varchar(80) NOT NULL,
  "entityType" varchar(80),
  "entityId" varchar(80),
  metadata text DEFAULT '{}',
  "ipAddress" varchar(80),
  "userAgent" varchar(320),
  "ActorId" uuid REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS universities_user_id_idx ON "Universities"("UserId");
CREATE INDEX IF NOT EXISTS applications_institution_id_idx ON "AdmissionApplications"("InstitutionId");
CREATE INDEX IF NOT EXISTS applications_student_id_idx ON "AdmissionApplications"("StudentId");
CREATE INDEX IF NOT EXISTS documents_university_id_idx ON "Documents"("UniversityId");
CREATE INDEX IF NOT EXISTS documents_application_id_idx ON "Documents"("AdmissionApplicationId");
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON "Notifications"("UserId");
CREATE INDEX IF NOT EXISTS notifications_application_id_idx ON "Notifications"("AdmissionApplicationId");
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON "AuditLogs"("ActorId");

DROP TRIGGER IF EXISTS users_set_updated_at ON "Users";
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON "Users"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS institutions_set_updated_at ON "Institutions";
CREATE TRIGGER institutions_set_updated_at BEFORE UPDATE ON "Institutions"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS universities_set_updated_at ON "Universities";
CREATE TRIGGER universities_set_updated_at BEFORE UPDATE ON "Universities"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS admission_applications_set_updated_at ON "AdmissionApplications";
CREATE TRIGGER admission_applications_set_updated_at BEFORE UPDATE ON "AdmissionApplications"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS documents_set_updated_at ON "Documents";
CREATE TRIGGER documents_set_updated_at BEFORE UPDATE ON "Documents"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS notifications_set_updated_at ON "Notifications";
CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON "Notifications"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS audit_logs_set_updated_at ON "AuditLogs";
CREATE TRIGGER audit_logs_set_updated_at BEFORE UPDATE ON "AuditLogs"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
