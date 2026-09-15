import { z } from "zod";
import { loadProductionSecrets } from "../services/key-vault.service.js";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
} else {
  const keyVaultUrl = process.env.KEY_VAULT_URL;
  if (!keyVaultUrl) {
    throw new Error("KEY_VAULT_URL is required in production");
  }

  const secrets = await loadProductionSecrets(keyVaultUrl);
  process.env.DATABASE_URL = secrets.databaseUrl;
  process.env.APP_JWT_SECRET = secrets.appJwtSecret;
  process.env.GEMINI_API_KEY = secrets.geminiApiKey;
}

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  KEY_VAULT_URL: z.string().url().optional(),

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
