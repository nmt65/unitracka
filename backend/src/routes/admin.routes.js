import { Router } from "express";
import { z } from "zod";
import { createAdmissionProgram, createInstitution, createUniversityUser, importCatalogInstitutions, listAdmissionPrograms, listAuditLogs, listUsers, sendTestEmail, systemStatus, updateAdmissionProgram, updateInstitution } from "../controllers/admin.controller.js";
import { listInstitutions } from "../controllers/institutions.controller.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
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

const requirementSchema = z.object({
  documentName: z.string().min(2).max(180),
  category: z.string().min(2).max(80).default("Admitere"),
  isOptional: z.boolean().default(false),
  verificationRequired: z.boolean().default(true),
  rule: z.string().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(200).optional()
});

const programSchema = z.object({
  institutionId: z.string().uuid(),
  faculty: z.string().min(2).max(180),
  name: z.string().min(2).max(180),
  programType: z.enum(["licenta", "master", "doctorat"]).default("licenta"),
  academicYear: z.string().min(4).max(20).default("2026-2027"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  annualTuition: z.coerce.number().min(0).max(200000).optional().nullable(),
  seats: z.coerce.number().int().min(1).max(50000).optional().nullable(),
  language: z.string().max(80).optional().nullable(),
  admissionMethod: z.string().max(4000).optional().nullable(),
  website: z.string().trim().url().or(z.literal("")).optional().transform((value) => value || null),
  description: z.string().max(4000).optional().nullable(),
  status: z.enum(["active", "pending", "archived"]).default("active"),
  requirements: z.array(requirementSchema).max(30).optional().default([])
});

const programUpdateSchema = z.object({
  institutionId: z.string().uuid().optional(),
  faculty: z.string().min(2).max(180).optional(),
  name: z.string().min(2).max(180).optional(),
  programType: z.enum(["licenta", "master", "doctorat"]).optional(),
  academicYear: z.string().min(4).max(20).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  annualTuition: z.coerce.number().min(0).max(200000).optional().nullable(),
  seats: z.coerce.number().int().min(1).max(50000).optional().nullable(),
  language: z.string().max(80).optional().nullable(),
  admissionMethod: z.string().max(4000).optional().nullable(),
  website: z.string().trim().url().or(z.literal("")).optional().transform((value) => value === "" ? null : value),
  description: z.string().max(4000).optional().nullable(),
  status: z.enum(["active", "pending", "archived"]).optional(),
  requirements: z.array(requirementSchema).max(30).optional()
});

const programQuerySchema = z.object({
  institutionId: z.string().uuid().optional()
});

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));
adminRouter.get("/system-status", systemStatus);
adminRouter.post("/system-status/test-email", validateBody(testEmailSchema), sendTestEmail);
adminRouter.get("/institutions", listInstitutions);
adminRouter.post("/institutions/import-catalog", importCatalogInstitutions);
adminRouter.post("/institutions", validateBody(institutionSchema), createInstitution);
adminRouter.patch("/institutions/:id", validateBody(institutionUpdateSchema), updateInstitution);
adminRouter.get("/programs", validateQuery(programQuerySchema), listAdmissionPrograms);
adminRouter.post("/programs", validateBody(programSchema), createAdmissionProgram);
adminRouter.patch("/programs/:id", validateBody(programUpdateSchema), updateAdmissionProgram);
adminRouter.get("/users", listUsers);
adminRouter.post("/university-users", validateBody(universityUserSchema), createUniversityUser);
adminRouter.get("/audit-logs", listAuditLogs);
