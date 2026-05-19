import { Notification } from "../models/index.js";

export async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.findAll({
      where: { UserId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 50
    });
    return res.json({ notifications });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!notification) return res.status(404).json({ message: "Notificarea nu există." });
    await notification.update({ readAt: new Date() });
    return res.json({ notification });
  } catch (error) {
    next(error);
  }
}
