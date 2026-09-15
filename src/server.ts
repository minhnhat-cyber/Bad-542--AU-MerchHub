import { env } from "./config/env.js";

// In production, importing env waits for Azure Key Vault. Only initialize
// Prisma and the Express dependency graph after DATABASE_URL is available.
const [{ app }, { prisma }] = await Promise.all([
  import("./app.js"),
  import("./lib/prisma.js"),
]);

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(
    `AU MerchHub API listening on http://${env.HOST}:${env.PORT}`,
  );
});

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
