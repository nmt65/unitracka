import { z } from "zod";

export const documentCreateSchema = z.object({
  name: z.string().min(2).max(180),
  category: z.string().min(2).max(80).default("Custom"),
  isOptional: z.boolean().optional().default(false)
});

export const documentUpdateSchema = z.object({
  name: z.string().min(2).max(180).optional(),
  category: z.string().min(2).max(80).optional(),
  isOptional: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  verificationStatus: z.enum(["missing", "pending", "verified", "rejected"]).optional(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
});
