import {z} from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(100, { error: "Name must be less than 100 characters" }).trim(),});

export const updateCategorySchema = createCategorySchema;

export const categoryIdSchema = z.object({
  id: z.uuid({ error: "Invalid category ID" }),
});