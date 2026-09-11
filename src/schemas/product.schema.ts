import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }).max(160),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().finite().nonnegative().max(99_999_999.99),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  categoryId: z.uuid({ error: "Invalid category ID" }),
});

export const productIdSchema = z.object({
  id: z.uuid({ error: "Invalid product ID" }),
});
