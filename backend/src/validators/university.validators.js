import { z } from "zod";

export const statusValues = ["Wishlist", "Cercetare", "Aplicat", "Acceptat", "Respins"];
export const programTypes = ["licenta", "master", "doctorat"];

const optionalUrl = z
  .string()
  .trim()
  .url("Link invalid.")
  .or(z.literal(""))
  .optional()
  .transform((value) => value || null);

export const universitySchema = z.object({
  name: z.string().min(2).max(180),
  shortName: z.string().trim().max(20).optional().nullable(),
  country: z.string().min(2).max(120),
  countryCode: z.string().trim().max(8).optional().nullable(),
  faculty: z.string().min(2).max(180),
  program: z.string().min(2).max(180),
  programType: z.enum(programTypes).default("licenta"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline-ul trebuie sa fie YYYY-MM-DD."),
  officialLink: optionalUrl,
  notes: z.string().max(4000).optional().nullable(),
  status: z.enum(statusValues).default("Wishlist"),
  annualTuition: z.coerce.number().min(0).max(1000000).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(10).optional().nullable()
});

export const universityUpdateSchema = universitySchema.partial();

export const compareQuerySchema = z.object({
  ids: z.string().min(1).transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
});
