import { Router } from "express";
import { issueCsrfToken } from "../middleware/csrf.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  cnpCheckSchema,
  forgotPasswordSchema,
  loginSchema,
  passkeyAuthenticationSchema,
  passkeyEmailSchema,
  passkeyRegistrationSchema,
  registerSchema,
  resendEmailVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "../validators/auth.validators.js";
import {
  checkCnp,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resendEmailVerification,
  resetPassword,
  verifyEmail
} from "../controllers/auth.controller.js";
import {
  authenticationOptions,
  deletePasskey,
  listPasskeys,
  registrationOptions,
  verifyAuthentication,
  verifyRegistration
} from "../controllers/passkeys.controller.js";

export const authRouter = Router();

authRouter.get("/csrf-token", issueCsrfToken);
authRouter.post("/check-cnp", authRateLimiter, validateBody(cnpCheckSchema), checkCnp);
authRouter.post("/register", authRateLimiter, validateBody(registerSchema), register);
authRouter.post("/login", authRateLimiter, validateBody(loginSchema), login);
authRouter.post("/verify-email", authRateLimiter, validateBody(verifyEmailSchema), verifyEmail);
authRouter.post("/resend-verification", authRateLimiter, validateBody(resendEmailVerificationSchema), resendEmailVerification);
authRouter.post("/passkeys/authentication-options", authRateLimiter, validateBody(passkeyEmailSchema), authenticationOptions);
authRouter.post("/passkeys/authentication-verification", authRateLimiter, validateBody(passkeyAuthenticationSchema), verifyAuthentication);
authRouter.post("/forgot-password", authRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authRateLimiter, validateBody(resetPasswordSchema), resetPassword);
authRouter.get("/passkeys", requireAuth, listPasskeys);
authRouter.post("/passkeys/registration-options", requireAuth, authRateLimiter, registrationOptions);
authRouter.post("/passkeys/registration-verification", requireAuth, authRateLimiter, validateBody(passkeyRegistrationSchema), verifyRegistration);
authRouter.delete("/passkeys/:id", requireAuth, authRateLimiter, deletePasskey);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
