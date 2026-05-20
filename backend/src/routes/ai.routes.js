import { Router } from "express";
import { checkDocument, studentAdvice } from "../controllers/ai.controller.js";
import { documentRateLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";
import { documentCheckSchema, studentAdviceSchema } from "../validators/ai.validators.js";

export const aiRouter = Router();

aiRouter.post("/documents/check", documentRateLimiter, validateBody(documentCheckSchema), checkDocument);
aiRouter.post("/advisor/student", documentRateLimiter, validateBody(studentAdviceSchema), studentAdvice);
