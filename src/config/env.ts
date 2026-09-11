import "dotenv/config";
import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

const envSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),

  MICROSOFT_TENANT_ID: optionalUuid,
  MICROSOFT_CLIENT_ID: optionalUuid,
  MICROSOFT_ALLOWED_EMAIL_DOMAIN: optionalString,

  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.8-flash"),

  APP_JWT_SECRET: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(32).optional(),
  ),

  APP_JWT_ISSUER: z.string().default("au-merchhub"),
  APP_JWT_AUDIENCE: z.string().default("au-merchhub-api"),
});

export const env = envSchema.parse(process.env);
