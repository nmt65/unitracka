import { Router } from "express";
import { createApplication, listMine, updateApplicationStatus, workspaceApplications } from "../controllers/applications.controller.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { applicationQuerySchema, applicationSchema, applicationStatusSchema } from "../validators/application.validators.js";

export const applicationsRouter = Router();

applicationsRouter.get("/mine", requireRole("student", "admin"), listMine);
applicationsRouter.post("/", requireRole("student"), validateBody(applicationSchema), createApplication);
applicationsRouter.get("/workspace", requireRole("university", "admin"), validateQuery(applicationQuerySchema), workspaceApplications);
applicationsRouter.patch("/:id/status", requireRole("university", "admin"), validateBody(applicationStatusSchema), updateApplicationStatus);
