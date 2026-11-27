import { z } from "zod";
import { OAUTH_PROVIDER_IDS } from "@/lib/auth/providers";

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("invalidEmail")),
});

export const magicLinkSchema = emailSchema.extend({
  callbackUrl: z.string().optional(),
  locale: z.enum(["ar", "en"]),
});

export const oauthSignInSchema = z.object({
  provider: z.enum(OAUTH_PROVIDER_IDS),
  callbackUrl: z.string().optional(),
  locale: z.enum(["ar", "en"]),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
