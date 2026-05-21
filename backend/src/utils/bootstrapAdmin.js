import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/index.js";

export async function bootstrapAdmin() {
  if (!env.bootstrapAdmin) return { created: false, skipped: true };
  if (!env.adminPassword || env.adminPassword.length < 8) {
    throw new Error("BOOTSTRAP_ADMIN=true cere ADMIN_PASSWORD cu minimum 8 caractere.");
  }
  const existingAdmin = await User.unscoped().findOne({ where: { email: env.adminEmail } });
  if (existingAdmin) {
    if (existingAdmin.role !== "admin") await existingAdmin.update({ role: "admin" });
    if (env.bootstrapAdminResetPassword) {
      await existingAdmin.update({ passwordHash: await bcrypt.hash(env.adminPassword, 12) });
    }
    return { created: false, skipped: false };
  }
  await User.create({
    email: env.adminEmail,
    name: "Admin UniTrack",
    role: "admin",
    passwordHash: await bcrypt.hash(env.adminPassword, 12)
  });
  return { created: true, skipped: false };
}
