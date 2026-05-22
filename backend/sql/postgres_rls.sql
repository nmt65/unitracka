-- UniTrack PostgreSQL Row Level Security policies.
-- Apply after Sequelize has created the tables.
--
-- The API must set these variables for each authenticated request/transaction:
--   SELECT set_config('app.current_user_id', '<uuid>', true);
--   SELECT set_config('app.current_user_role', 'student|university|admin', true);
--   SELECT set_config('app.current_institution_id', '<uuid-or-empty>', true);
--
-- In local development UniTrack uses SQLite, so these policies are for the
-- PostgreSQL deployment required by a production-style InfoEducatie setup.

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_role', true), '')
$$;

CREATE OR REPLACE FUNCTION app.current_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_institution_id', true), '')::uuid
$$;

ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Institutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Universities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdmissionApplications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdmissionPrograms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgramRequirements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiUsages" ENABLE ROW LEVEL SECURITY;

-- Nu folosim FORCE ROW LEVEL SECURITY implicit, ca backend-ul server-side
-- conectat cu rolul de owner/service sa poata aplica autorizarea din API.
-- Daca rulezi API-ul cu un rol fara BYPASSRLS si setezi contextul app.*
-- pe fiecare tranzactie, poti activa FORCE manual dupa testare.

DROP POLICY IF EXISTS users_read_scope ON "Users";
DROP POLICY IF EXISTS users_insert_scope ON "Users";
DROP POLICY IF EXISTS users_update_scope ON "Users";
DROP POLICY IF EXISTS users_delete_admin ON "Users";

CREATE POLICY users_read_scope
  ON "Users"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR id = app.current_user_id()
    OR (
      app.current_user_role() = 'university'
      AND EXISTS (
        SELECT 1
        FROM "AdmissionApplications" aa
        WHERE aa."StudentId" = "Users".id
          AND aa."InstitutionId" = app.current_institution_id()
      )
    )
  );

CREATE POLICY users_insert_scope
  ON "Users"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR id = app.current_user_id()
  );

CREATE POLICY users_update_scope
  ON "Users"
  FOR UPDATE
  USING (app.current_user_role() = 'admin' OR id = app.current_user_id())
  WITH CHECK (app.current_user_role() = 'admin' OR id = app.current_user_id());

CREATE POLICY users_delete_admin
  ON "Users"
  FOR DELETE
  USING (app.current_user_role() = 'admin');

DROP POLICY IF EXISTS institutions_read_scope ON "Institutions";
DROP POLICY IF EXISTS institutions_write_admin ON "Institutions";
DROP POLICY IF EXISTS institutions_update_admin ON "Institutions";
DROP POLICY IF EXISTS institutions_delete_admin ON "Institutions";

CREATE POLICY institutions_read_scope
  ON "Institutions"
  FOR SELECT
  USING (
    status = 'active'
    OR app.current_user_role() = 'admin'
    OR id = app.current_institution_id()
  );

CREATE POLICY institutions_write_admin
  ON "Institutions"
  FOR INSERT
  WITH CHECK (app.current_user_role() = 'admin');

CREATE POLICY institutions_update_admin
  ON "Institutions"
  FOR UPDATE
  USING (app.current_user_role() = 'admin')
  WITH CHECK (app.current_user_role() = 'admin');

CREATE POLICY institutions_delete_admin
  ON "Institutions"
  FOR DELETE
  USING (app.current_user_role() = 'admin');

DROP POLICY IF EXISTS universities_owner_scope ON "Universities";
DROP POLICY IF EXISTS universities_read_scope ON "Universities";
DROP POLICY IF EXISTS universities_write_admin ON "Universities";
DROP POLICY IF EXISTS universities_update_admin ON "Universities";
DROP POLICY IF EXISTS universities_delete_admin ON "Universities";

CREATE POLICY universities_read_scope
  ON "Universities"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

CREATE POLICY universities_write_admin
  ON "Universities"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

CREATE POLICY universities_update_admin
  ON "Universities"
  FOR UPDATE
  USING (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  )
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

CREATE POLICY universities_delete_admin
  ON "Universities"
  FOR DELETE
  USING (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

DROP POLICY IF EXISTS applications_read_scope ON "AdmissionApplications";
DROP POLICY IF EXISTS applications_insert_student ON "AdmissionApplications";
DROP POLICY IF EXISTS applications_update_scope ON "AdmissionApplications";
DROP POLICY IF EXISTS applications_delete_scope ON "AdmissionApplications";

CREATE POLICY applications_read_scope
  ON "AdmissionApplications"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR "StudentId" = app.current_user_id()
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY applications_insert_student
  ON "AdmissionApplications"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR (
      app.current_user_role() = 'student'
      AND "StudentId" = app.current_user_id()
    )
  );

CREATE POLICY applications_update_scope
  ON "AdmissionApplications"
  FOR UPDATE
  USING (
    app.current_user_role() = 'admin'
    OR "StudentId" = app.current_user_id()
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  )
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "StudentId" = app.current_user_id()
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY applications_delete_scope
  ON "AdmissionApplications"
  FOR DELETE
  USING (
    app.current_user_role() = 'admin'
    OR "StudentId" = app.current_user_id()
  );

DROP POLICY IF EXISTS admission_programs_read_scope ON "AdmissionPrograms";
DROP POLICY IF EXISTS admission_programs_insert_scope ON "AdmissionPrograms";
DROP POLICY IF EXISTS admission_programs_update_scope ON "AdmissionPrograms";
DROP POLICY IF EXISTS admission_programs_delete_scope ON "AdmissionPrograms";

CREATE POLICY admission_programs_read_scope
  ON "AdmissionPrograms"
  FOR SELECT
  USING (
    status = 'active'
    OR app.current_user_role() = 'admin'
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY admission_programs_insert_scope
  ON "AdmissionPrograms"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY admission_programs_update_scope
  ON "AdmissionPrograms"
  FOR UPDATE
  USING (
    app.current_user_role() = 'admin'
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  )
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR (
      app.current_user_role() = 'university'
      AND "InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY admission_programs_delete_scope
  ON "AdmissionPrograms"
  FOR DELETE
  USING (app.current_user_role() = 'admin');

DROP POLICY IF EXISTS program_requirements_read_scope ON "ProgramRequirements";
DROP POLICY IF EXISTS program_requirements_insert_scope ON "ProgramRequirements";
DROP POLICY IF EXISTS program_requirements_update_scope ON "ProgramRequirements";
DROP POLICY IF EXISTS program_requirements_delete_scope ON "ProgramRequirements";

CREATE POLICY program_requirements_read_scope
  ON "ProgramRequirements"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "AdmissionPrograms" ap
      WHERE ap.id = "ProgramRequirements"."AdmissionProgramId"
        AND (
          ap.status = 'active'
          OR app.current_user_role() = 'admin'
          OR (
            app.current_user_role() = 'university'
            AND ap."InstitutionId" = app.current_institution_id()
          )
        )
    )
  );

CREATE POLICY program_requirements_insert_scope
  ON "ProgramRequirements"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "AdmissionPrograms" ap
      WHERE ap.id = "ProgramRequirements"."AdmissionProgramId"
        AND app.current_user_role() = 'university'
        AND ap."InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY program_requirements_update_scope
  ON "ProgramRequirements"
  FOR UPDATE
  USING (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "AdmissionPrograms" ap
      WHERE ap.id = "ProgramRequirements"."AdmissionProgramId"
        AND app.current_user_role() = 'university'
        AND ap."InstitutionId" = app.current_institution_id()
    )
  )
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "AdmissionPrograms" ap
      WHERE ap.id = "ProgramRequirements"."AdmissionProgramId"
        AND app.current_user_role() = 'university'
        AND ap."InstitutionId" = app.current_institution_id()
    )
  );

CREATE POLICY program_requirements_delete_scope
  ON "ProgramRequirements"
  FOR DELETE
  USING (app.current_user_role() = 'admin');

DROP POLICY IF EXISTS documents_read_scope ON "Documents";
DROP POLICY IF EXISTS documents_write_scope ON "Documents";
DROP POLICY IF EXISTS documents_update_scope ON "Documents";
DROP POLICY IF EXISTS documents_delete_scope ON "Documents";

CREATE POLICY documents_read_scope
  ON "Documents"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "Universities" u
      WHERE u.id = "Documents"."UniversityId"
        AND u."UserId" = app.current_user_id()
    )
    OR EXISTS (
      SELECT 1
      FROM "AdmissionApplications" aa
      WHERE aa.id = "Documents"."AdmissionApplicationId"
        AND (
          aa."StudentId" = app.current_user_id()
          OR (
            app.current_user_role() = 'university'
            AND aa."InstitutionId" = app.current_institution_id()
          )
        )
    )
  );

CREATE POLICY documents_write_scope
  ON "Documents"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "Universities" u
      WHERE u.id = "Documents"."UniversityId"
        AND u."UserId" = app.current_user_id()
    )
    OR EXISTS (
      SELECT 1
      FROM "AdmissionApplications" aa
      WHERE aa.id = "Documents"."AdmissionApplicationId"
        AND aa."StudentId" = app.current_user_id()
    )
  );

CREATE POLICY documents_update_scope
  ON "Documents"
  FOR UPDATE
  USING (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "Universities" u
      WHERE u.id = "Documents"."UniversityId"
        AND u."UserId" = app.current_user_id()
    )
    OR EXISTS (
      SELECT 1
      FROM "AdmissionApplications" aa
      WHERE aa.id = "Documents"."AdmissionApplicationId"
        AND (
          aa."StudentId" = app.current_user_id()
          OR (
            app.current_user_role() = 'university'
            AND aa."InstitutionId" = app.current_institution_id()
          )
        )
    )
  )
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "Universities" u
      WHERE u.id = "Documents"."UniversityId"
        AND u."UserId" = app.current_user_id()
    )
    OR EXISTS (
      SELECT 1
      FROM "AdmissionApplications" aa
      WHERE aa.id = "Documents"."AdmissionApplicationId"
        AND aa."StudentId" = app.current_user_id()
    )
  );

CREATE POLICY documents_delete_scope
  ON "Documents"
  FOR DELETE
  USING (
    app.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM "Universities" u
      WHERE u.id = "Documents"."UniversityId"
        AND u."UserId" = app.current_user_id()
    )
    OR EXISTS (
      SELECT 1
      FROM "AdmissionApplications" aa
      WHERE aa.id = "Documents"."AdmissionApplicationId"
        AND aa."StudentId" = app.current_user_id()
    )
  );

DROP POLICY IF EXISTS notifications_read_own ON "Notifications";
DROP POLICY IF EXISTS notifications_insert_scope ON "Notifications";
DROP POLICY IF EXISTS notifications_update_own ON "Notifications";
DROP POLICY IF EXISTS notifications_delete_admin ON "Notifications";

CREATE POLICY notifications_read_own
  ON "Notifications"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

CREATE POLICY notifications_insert_scope
  ON "Notifications"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
    OR (
      app.current_user_role() = 'university'
      AND EXISTS (
        SELECT 1
        FROM "AdmissionApplications" aa
        WHERE aa.id = "Notifications"."AdmissionApplicationId"
          AND aa."InstitutionId" = app.current_institution_id()
      )
    )
    OR (
      app.current_user_role() = 'student'
      AND EXISTS (
        SELECT 1
        FROM "AdmissionApplications" aa
        JOIN "Users" staff ON staff.id = "Notifications"."UserId"
        WHERE aa.id = "Notifications"."AdmissionApplicationId"
          AND aa."StudentId" = app.current_user_id()
          AND staff.role = 'university'
          AND staff."InstitutionId" = aa."InstitutionId"
      )
    )
  );

CREATE POLICY notifications_update_own
  ON "Notifications"
  FOR UPDATE
  USING (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  )
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

CREATE POLICY notifications_delete_admin
  ON "Notifications"
  FOR DELETE
  USING (app.current_user_role() = 'admin');

DROP POLICY IF EXISTS audit_logs_read_admin ON "AuditLogs";
DROP POLICY IF EXISTS audit_logs_insert_scope ON "AuditLogs";
DROP POLICY IF EXISTS audit_logs_update_none ON "AuditLogs";
DROP POLICY IF EXISTS audit_logs_delete_admin ON "AuditLogs";

CREATE POLICY audit_logs_read_admin
  ON "AuditLogs"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR "ActorId" = app.current_user_id()
  );

CREATE POLICY audit_logs_insert_scope
  ON "AuditLogs"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "ActorId" = app.current_user_id()
    OR "ActorId" IS NULL
  );

CREATE POLICY audit_logs_update_none
  ON "AuditLogs"
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY audit_logs_delete_admin
  ON "AuditLogs"
  FOR DELETE
  USING (app.current_user_role() = 'admin');

DROP POLICY IF EXISTS ai_usage_read_scope ON "AiUsages";
DROP POLICY IF EXISTS ai_usage_insert_own ON "AiUsages";
DROP POLICY IF EXISTS ai_usage_update_none ON "AiUsages";
DROP POLICY IF EXISTS ai_usage_delete_admin ON "AiUsages";

CREATE POLICY ai_usage_read_scope
  ON "AiUsages"
  FOR SELECT
  USING (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
    OR (
      app.current_user_role() = 'university'
      AND EXISTS (
        SELECT 1
        FROM "AdmissionApplications" aa
        WHERE aa.id = "AiUsages"."AdmissionApplicationId"
          AND aa."InstitutionId" = app.current_institution_id()
      )
    )
  );

CREATE POLICY ai_usage_insert_own
  ON "AiUsages"
  FOR INSERT
  WITH CHECK (
    app.current_user_role() = 'admin'
    OR "UserId" = app.current_user_id()
  );

CREATE POLICY ai_usage_update_none
  ON "AiUsages"
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY ai_usage_delete_admin
  ON "AiUsages"
  FOR DELETE
  USING (app.current_user_role() = 'admin');
