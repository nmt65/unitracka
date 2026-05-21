import { Router } from "express";
import { z } from "zod";
import { createInstitution, createUniversityUser, importCatalogInstitutions, listAuditLogs, listUsers, sendTestEmail, systemStatus, updateInstitution } from "../controllers/admin.controller.js";
import { listInstitutions } from "../controllers/institutions.controller.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { institutionSchema, institutionUpdateSchema } from "../validators/institution.validators.js";

const universityUserSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  name: z.string().min(2).max(120).optional(),
  institutionId: z.string().uuid()
});

const testEmailSchema = z.object({
  email: z.string().email().max(180).optional()
});

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));
adminRouter.get("/system-status", systemStatus);
adminRouter.post("/system-status/test-email", validateBody(testEmailSchema), sendTestEmail);
adminRouter.get("/institutions", listInstitutions);
adminRouter.post("/institutions/import-catalog", importCatalogInstitutions);
adminRouter.post("/institutions", validateBody(institutionSchema), createInstitution);
adminRouter.patch("/institutions/:id", validateBody(institutionUpdateSchema), updateInstitution);
adminRouter.get("/users", listUsers);
adminRouter.post("/university-users", validateBody(universityUserSchema), createUniversityUser);
adminRouter.get("/audit-logs", listAuditLogs);
