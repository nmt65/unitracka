import { Router } from "express";
import { publicInstitutions } from "../controllers/institutions.controller.js";

export const institutionsRouter = Router();

institutionsRouter.get("/public", publicInstitutions);
