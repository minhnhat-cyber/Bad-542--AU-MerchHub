import { spawn } from "node:child_process";
import { env } from "./config/env.js";

const prismaCli = new URL("../node_modules/prisma/build/index.js", import.meta.url);
const child = spawn(process.execPath, [prismaCli.pathname, "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error("Unable to start Prisma migration", error);
  process.exit(1);
});
