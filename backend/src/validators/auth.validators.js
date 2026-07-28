import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Parola trebuie sa aiba minimum 8 caractere."),
  name: z.string().min(2).max(120).optional(),
  role: z.enum(["student", "university"]).default("student"),
  cnp: z.string().optional(),
  institutionId: z.string().uuid().optional(),
  acceptedPrivacyPolicy: z.literal(true, {
    errorMap: () => ({ message: "Trebuie să accepți politica de confidențialitate." })
  })
});

export const loginSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase())
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8, "Parola trebuie să aibă minimum 8 caractere.")
});

export const cnpCheckSchema = z.object({
  cnp: z.string().min(13).max(32)
});

export const verifyEmailSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase()),
  code: z.string().regex(/^\d{6}$/, "Codul trebuie să conțină 6 cifre.")
});

export const resendEmailVerificationSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase())
});

export const passkeyEmailSchema = resendEmailVerificationSchema;

export const passkeyRegistrationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  response: z.record(z.any())
});

export const passkeyAuthenticationSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase()),
  response: z.record(z.any())
});
