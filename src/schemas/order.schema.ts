import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.uuid({ error: "Invalid product ID" }),
  quantity: z.coerce.number().int().min(1).max(100),
});

export const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1).max(50),
  })
  .superRefine(({ items }, context) => {
    const productIds = new Set<string>();

    items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Each product may appear only once in an order",
        });
      }

      productIds.add(item.productId);
    });
  });

export const orderIdSchema = z.object({
  id: z.uuid({ error: "Invalid order ID" }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]),
});
