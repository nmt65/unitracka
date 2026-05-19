import { Router } from "express";
import { listNotifications, markNotificationRead } from "../controllers/notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", listNotifications);
notificationsRouter.patch("/:id/read", markNotificationRead);
