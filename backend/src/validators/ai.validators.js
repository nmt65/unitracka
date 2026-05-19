import { z } from "zod";

export const documentCheckSchema = z.object({
  documentId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  expectedType: z.string().min(2).max(180),
  fileName: z.string().min(2).max(240),
  mimeType: z.string().max(120).optional().nullable(),
  text: z.string().max(12000).optional().default("")
});
