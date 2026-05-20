import { Router } from "express";
import { myInstitution, publicInstitutions, updateMyInstitution } from "../controllers/institutions.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { institutionProfileSchema } from "../validators/institution.validators.js";

export const institutionsRouter = Router();

institutionsRouter.get("/public", publicInstitutions);
institutionsRouter.get("/me", requireAuth, myInstitution);
institutionsRouter.patch("/me", requireAuth, validateBody(institutionProfileSchema), updateMyInstitution);
