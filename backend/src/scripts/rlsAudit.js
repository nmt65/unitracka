import { QueryTypes } from "sequelize";
import { env } from "../config/env.js";
import { sequelize } from "../models/index.js";

const report = {
  dialect: env.dbDialect,
  connected: false,
  role: null,
  bypassRls: null,
  tables: [],
  policies: [],
  strictReady: false,
  errors: []
};

try {
  if (env.dbDialect !== "postgres") throw new Error("Auditul RLS necesită DB_DIALECT=postgres.");
  await sequelize.authenticate();
  report.connected = true;

  const [role] = await sequelize.query(`
    SELECT current_user AS role, rolbypassrls AS "bypassRls"
    FROM pg_roles
    WHERE rolname = current_user
  `, { type: QueryTypes.SELECT });
  report.role = role?.role || null;
  report.bypassRls = Boolean(role?.bypassRls);

  report.tables = await sequelize.query(`
    SELECT c.relname AS table, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('Users','Institutions','Universities','AdmissionApplications',
        'AdmissionPrograms','ProgramRequirements','Documents','Notifications',
        'AuditLogs','AiUsages','Passkeys')
    ORDER BY c.relname
  `, { type: QueryTypes.SELECT });

  report.policies = await sequelize.query(`
    SELECT tablename AS table, policyname AS policy, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `, { type: QueryTypes.SELECT });

  report.strictReady = !report.bypassRls
    && report.tables.length === 11
    && report.tables.every((table) => table.enabled)
    && report.policies.length > 0;
} catch (error) {
  report.errors.push(error.message);
  process.exitCode = 1;
} finally {
  console.log(JSON.stringify(report, null, 2));
  await sequelize.close().catch(() => {});
}
