import { Router } from "express";
import { issueCsrfToken } from "../middleware/csrf.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { cnpCheckSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validators/auth.validators.js";
import { checkCnp, forgotPassword, login, logout, me, register, resetPassword } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.get("/csrf-token", issueCsrfToken);
authRouter.post("/check-cnp", authRateLimiter, validateBody(cnpCheckSchema), checkCnp);
authRouter.post("/register", authRateLimiter, validateBody(registerSchema), register);
authRouter.post("/login", authRateLimiter, validateBody(loginSchema), login);
authRouter.post("/forgot-password", authRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authRateLimiter, validateBody(resetPasswordSchema), resetPassword);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
