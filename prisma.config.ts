import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
    // A shadow database is needed by `migrate dev`, not by production
    // `migrate deploy`. Keep it optional so production can source only the
    // real connection string from Azure Key Vault.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
