import { z } from "zod";

export const microsoftLoginSchema = z.object({
  idToken: z.string().min(1, { error: "Microsoft ID token is required" }),
});
