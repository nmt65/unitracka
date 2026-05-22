CREATE TABLE IF NOT EXISTS "AdmissionPrograms" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty varchar(180) NOT NULL,
  name varchar(180) NOT NULL,
  "programType" text DEFAULT 'licenta' CHECK ("programType" IN ('licenta', 'master', 'doctorat')),
  "academicYear" varchar(20) DEFAULT '2026-2027',
  deadline date,
  "annualTuition" double precision,
  seats integer,
  language varchar(80),
  "admissionMethod" text,
  website varchar(500),
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived')),
  source varchar(60) DEFAULT 'manual',
  "InstitutionId" uuid NOT NULL REFERENCES "Institutions"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_institution_year_name_unique UNIQUE ("InstitutionId", "academicYear", faculty, name, "programType")
);

CREATE TABLE IF NOT EXISTS "ProgramRequirements" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentName" varchar(180) NOT NULL,
  category varchar(80) DEFAULT 'Admitere',
  "isOptional" boolean DEFAULT false,
  "verificationRequired" boolean DEFAULT true,
  rule text,
  "sortOrder" integer DEFAULT 0,
  "AdmissionProgramId" uuid NOT NULL REFERENCES "AdmissionPrograms"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_requirement_unique UNIQUE ("AdmissionProgramId", "documentName")
);

CREATE TABLE IF NOT EXISTS "AiUsages" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL CHECK (feature IN ('document', 'advisor')),
  provider varchar(40),
  model varchar(120),
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
  "requestHash" varchar(64),
  "inputBytes" integer,
  "estimatedTokens" integer,
  metadata text DEFAULT '{}',
  "UserId" uuid REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "DocumentId" uuid REFERENCES "Documents"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "AdmissionApplicationId" uuid REFERENCES "AdmissionApplications"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "AdmissionApplications"
ADD COLUMN IF NOT EXISTS "AdmissionProgramId" uuid REFERENCES "AdmissionPrograms"(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Documents"
ADD COLUMN IF NOT EXISTS "storageProvider" varchar(40),
ADD COLUMN IF NOT EXISTS "storageBucket" varchar(120),
ADD COLUMN IF NOT EXISTS "storagePath" varchar(600),
ADD COLUMN IF NOT EXISTS "fileSize" integer,
ADD COLUMN IF NOT EXISTS "fileDataUrl" text;

CREATE INDEX IF NOT EXISTS admission_programs_institution_idx ON "AdmissionPrograms"("InstitutionId");
CREATE INDEX IF NOT EXISTS admission_programs_status_idx ON "AdmissionPrograms"(status);
CREATE INDEX IF NOT EXISTS program_requirements_program_idx ON "ProgramRequirements"("AdmissionProgramId");
CREATE INDEX IF NOT EXISTS applications_program_id_idx ON "AdmissionApplications"("AdmissionProgramId");
CREATE INDEX IF NOT EXISTS ai_usage_user_feature_created_idx ON "AiUsages"("UserId", feature, "createdAt");
CREATE INDEX IF NOT EXISTS ai_usage_document_idx ON "AiUsages"("DocumentId");
CREATE INDEX IF NOT EXISTS ai_usage_application_idx ON "AiUsages"("AdmissionApplicationId");

DROP TRIGGER IF EXISTS admission_programs_set_updated_at ON "AdmissionPrograms";
CREATE TRIGGER admission_programs_set_updated_at BEFORE UPDATE ON "AdmissionPrograms"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS program_requirements_set_updated_at ON "ProgramRequirements";
CREATE TRIGGER program_requirements_set_updated_at BEFORE UPDATE ON "ProgramRequirements"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS ai_usages_set_updated_at ON "AiUsages";
CREATE TRIGGER ai_usages_set_updated_at BEFORE UPDATE ON "AiUsages"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

