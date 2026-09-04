import { z } from "zod";

// Validates data when creating a new product
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(150, { error: "Name must be less than 150 characters" })
    .trim(),

  description: z
    .string()
    .max(2000, { error: "Description must be less than 2000 characters" })
    .trim()
    .optional(),

  price: z.coerce
    .number()
    .positive({ error: "Price must be greater than 0" }),

  stock: z.coerce
    .number()
    .int()
    .min(0, { error: "Stock cannot be negative" }),

  imageUrl: z
    .string()
    .url({ error: "Image URL must be valid" })
    .optional(),

  departmentCode: z
    .string()
    .max(100, { error: "Department code must be less than 100 characters" })
    .trim()
    .optional(),

  categoryId: z.uuid({
    error: "Invalid category ID",
  }),

  isActive: z.boolean().optional(),
});

// Allows partial updates, such as changing only stock or price
export const updateProductSchema = createProductSchema.partial();

// Validates the product ID from the URL
export const productIdSchema = z.object({
  id: z.uuid({
    error: "Invalid product ID",
  }),
});