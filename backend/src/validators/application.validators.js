import { z } from "zod";

export const applicationSchema = z.object({
  institutionId: z.string().uuid(),
  program: z.string().min(2).max(180),
  faculty: z.string().max(180).optional().nullable(),
  programType: z.enum(["licenta", "master", "doctorat"]).default("licenta"),
  admissionScore: z.coerce.number().min(0).max(10).optional().nullable(),
  notes: z.string().max(4000).optional().nullable()
});

export const applicationStatusSchema = z.object({
  status: z.enum(["submitted", "under_review", "accepted", "rejected", "waitlist"]),
  reviewerNotes: z.string().max(4000).optional().nullable()
});

export const applicationQuerySchema = z.object({
  status: z.enum(["all", "submitted", "under_review", "accepted", "rejected", "waitlist"]).default("all"),
  sort: z.enum(["newest", "oldest", "score", "status"]).default("newest")
});
