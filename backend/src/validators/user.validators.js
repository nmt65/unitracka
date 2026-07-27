import { z } from "zod";

const maxTwoDecimals = (value) => {
  if (value === null || value === undefined) return true;
  const scaled = Number(value) * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-8;
};
const noLongDecimalScores = (value = "") => !/\d+[.,]\d{3,}/.test(String(value));
const validAvatar = (value = "") => !value || (String(value).startsWith("data:image/") && String(value).length <= 450000);

export const profileSchema = z.object({
  name: z.string().min(2).max(120),
  bacAverage: z.coerce.number().min(1).max(10).refine(maxTwoDecimals, "Media BAC poate avea maximum două zecimale.").nullable().optional(),
  languageResults: z.string().max(1200).refine(noLongDecimalScores, "Rezultatele examenelor pot avea maximum două zecimale.").optional().default(""),
  interests: z.array(z.string().min(2).max(80)).max(20).optional().default([]),
  emailNotifications: z.boolean().optional().default(true),
  notifyBeforeDays: z.coerce.number().int().min(1).max(60).optional().default(14),
  avatarDataUrl: z.string().max(450000).refine(validAvatar, "Poza trebuie să fie o imagine validă optimizată.").optional().default("")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Parola nouă trebuie să aibă minimum 8 caractere.")
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmation: z.literal("STERG CONTUL", {
    errorMap: () => ({ message: "Scrie exact STERG CONTUL pentru confirmare." })
  })
});
