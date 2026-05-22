import { Router } from "express";
import { createMyProgram, listMyPrograms, myInstitution, publicInstitutions, updateMyInstitution, updateMyProgram } from "../controllers/institutions.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { institutionProfileSchema } from "../validators/institution.validators.js";
import { z } from "zod";

export const institutionsRouter = Router();

const requirementSchema = z.object({
  documentName: z.string().min(2).max(180),
  category: z.string().min(2).max(80).default("Admitere"),
  isOptional: z.boolean().default(false),
  verificationRequired: z.boolean().default(true),
  rule: z.string().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(200).optional()
});

const programSchema = z.object({
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

institutionsRouter.get("/public", publicInstitutions);
institutionsRouter.get("/me", requireAuth, myInstitution);
institutionsRouter.patch("/me", requireAuth, validateBody(institutionProfileSchema), updateMyInstitution);
institutionsRouter.get("/me/programs", requireAuth, listMyPrograms);
institutionsRouter.post("/me/programs", requireAuth, validateBody(programSchema), createMyProgram);
institutionsRouter.patch("/me/programs/:id", requireAuth, validateBody(programUpdateSchema), updateMyProgram);
