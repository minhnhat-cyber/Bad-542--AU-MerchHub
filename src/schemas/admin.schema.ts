import { z } from "zod";

export const userIdSchema = z.object({
  id: z.uuid({ error: "Invalid user ID" }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["STUDENT", "STAFF", "ADMIN"]),
});
