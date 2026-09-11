import { Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  createProductSchema,
  productIdSchema,
} from "../schemas/product.schema.js";
import { generateProductDescription } from "../services/gemini.service.js";

export const productRouter = Router();

const productInclude = {
  category: {
    select: { id: true, name: true },
  },
} satisfies Prisma.ProductInclude;

productRouter.get("/", async (_request, response) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return response.status(200).json({ success: true, data: products });
});

productRouter.post(
  "/generate-description",
  requireAuth,
  requireRoles(Role.STAFF, Role.ADMIN),
  async (request, response) => {
    const parsedBody = z
      .object({
        name: z.string().trim().min(1).max(160),
        category: z.string().trim().min(1).max(100),
      })
      .safeParse(request.body);

    if (!parsedBody.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedBody.error),
      });
    }

    const description = await generateProductDescription(parsedBody.data);

    return response.status(200).json({
      success: true,
      data: { description },
    });
  },
);

productRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.STAFF, Role.ADMIN),
  async (request, response) => {
    const parsedBody = createProductSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedBody.error),
      });
    }

    try {
      const product = await prisma.product.create({
        data: {
          ...parsedBody.data,
          description: parsedBody.data.description || null,
          createdById: request.auth!.userId,
        },
        include: productInclude,
      });

      return response.status(201).json({ success: true, data: product });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return response.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      throw error;
    }
  },
);

productRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.STAFF, Role.ADMIN),
  async (request, response) => {
    const parsedParams = productIdSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedParams.error),
      });
    }

    const result = await prisma.product.updateMany({
      where: { id: parsedParams.data.id, active: true },
      data: { active: false },
    });

    if (result.count === 0) {
      return response.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    return response.status(204).send();
  },
);
