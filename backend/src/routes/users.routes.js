import { Router } from "express";
import { changePassword, deleteAccount, getProfile, publicShare, rotateShareLink, updateProfile } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { changePasswordSchema, deleteAccountSchema, profileSchema } from "../validators/user.validators.js";

export const usersRouter = Router();

usersRouter.get("/public/:shareId", publicShare);
usersRouter.get("/profile", requireAuth, getProfile);
usersRouter.put("/profile", requireAuth, validateBody(profileSchema), updateProfile);
usersRouter.post("/profile/share-link", requireAuth, rotateShareLink);
usersRouter.patch("/profile/password", requireAuth, validateBody(changePasswordSchema), changePassword);
usersRouter.delete("/profile", requireAuth, validateBody(deleteAccountSchema), deleteAccount);
