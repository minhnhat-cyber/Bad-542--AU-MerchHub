import { Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware.js";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";
import { z } from "zod";

export const categoryRouter = Router();

categoryRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN),
  async (request, response) => {
    const parsedBody = createCategorySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedBody.error),
      });
    }

    try {
      const category = await prisma.category.create({
        data: {
          name: parsedBody.data.name,
        },
      });

      return response.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return response.status(409).json({
          success: false,
          error: "Category name already exists",
        });
      }

      throw error;
    }
  },
);

categoryRouter.get("/", async (_request, response) => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return response.status(200).json({
    success: true,
    data: categories,
  });
});

categoryRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  async (request, response) => {
    const parsedParams = categoryIdSchema.safeParse(request.params);
    const parsedBody = updateCategorySchema.safeParse(request.body);

    if (!parsedParams.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedParams.error),
      });
    }

    if (!parsedBody.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedBody.error),
      });
    }

    try {
      const category = await prisma.category.update({
        where: {
          id: parsedParams.data.id,
        },
        data: {
          name: parsedBody.data.name,
        },
      });

      return response.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return response.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return response.status(409).json({
          success: false,
          error: "Category name already exists",
        });
      }

      throw error;
    }
  },
);

categoryRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  async (request, response) => {
    const parsedParams = categoryIdSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return response.status(400).json({
        success: false,
        error: z.treeifyError(parsedParams.error),
      });
    }

    try {
      await prisma.category.delete({
        where: {
          id: parsedParams.data.id,
        },
      });

      return response.status(204).send();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return response.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return response.status(409).json({
          success: false,
          error: "Cannot delete a category that still has products",
        });
      }

      throw error;
    }
  },
);
