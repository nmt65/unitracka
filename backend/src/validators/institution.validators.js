import { z } from "zod";

const optionalUrl = z.string().trim().url().or(z.literal("")).optional().transform((value) => value || null);

export const institutionSchema = z.object({
  name: z.string().min(2).max(180),
  shortName: z.string().min(1).max(20),
  country: z.string().min(2).max(120).default("România"),
  countryCode: z.string().min(2).max(8).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  website: optionalUrl,
  contactEmail: z.string().email().max(180).optional().nullable(),
  status: z.enum(["active", "pending", "disabled"]).default("active"),
  description: z.string().max(4000).optional().nullable()
});

export const institutionUpdateSchema = institutionSchema.partial();

export const institutionProfileSchema = z.object({
  website: optionalUrl,
  contactEmail: z.string().email().max(180).optional().nullable(),
  description: z.string().max(4000).optional().nullable()
});
