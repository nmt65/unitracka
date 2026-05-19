import { Router } from "express";
import { compareUniversities, createUniversity, dashboardStats, deleteUniversity, listUniversities, updateUniversity } from "../controllers/universities.controller.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { compareQuerySchema, universitySchema, universityUpdateSchema } from "../validators/university.validators.js";

export const universitiesRouter = Router();

universitiesRouter.get("/", listUniversities);
universitiesRouter.get("/stats", dashboardStats);
universitiesRouter.get("/compare", validateQuery(compareQuerySchema), compareUniversities);
universitiesRouter.post("/", requireRole("student", "admin"), validateBody(universitySchema), createUniversity);
universitiesRouter.patch("/:id", requireRole("student", "admin"), validateBody(universityUpdateSchema), updateUniversity);
universitiesRouter.delete("/:id", requireRole("student", "admin"), deleteUniversity);
