import { z } from "zod";

export const documentCheckSchema = z.object({
  documentId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  expectedType: z.string().min(2).max(180),
  fileName: z.string().min(2).max(240),
  mimeType: z.string().max(120).optional().nullable(),
  fileSize: z.coerce.number().int().min(0).max(5_000_000).optional().nullable(),
  fileDataUrl: z.string().max(7_000_000).optional().nullable(),
  text: z.string().max(12000).optional().default("")
});

export const studentAdviceSchema = z.object({
  institutionId: z.string().uuid().optional(),
  universityId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  cvText: z.string().max(12000).optional().default(""),
  personalGoal: z.string().max(1200).optional().default("")
});
