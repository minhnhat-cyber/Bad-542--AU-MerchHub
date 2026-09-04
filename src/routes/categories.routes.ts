import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";
import { z } from "zod";

export const categoryRouter = Router();

// Creates a new category
categoryRouter.post("/", async (request, response) => {
  const parsedBody = createCategorySchema.safeParse(request.body);

  // Reject invalid request data
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
    // Handles duplicate category names
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return response.status(409).json({
        success: false,
        error: "Category name already exists",
      });
    }

    throw error;
  }
});

// Gets all categories
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

// Updates an existing category
categoryRouter.patch("/:id", async (request, response) => {
  const parsedParams = categoryIdSchema.safeParse(request.params);
  const parsedBody = updateCategorySchema.safeParse(request.body);

  // Validates category ID
  if (!parsedParams.success) {
    return response.status(400).json({
      success: false,
      error: z.treeifyError(parsedParams.error),
    });
  }

  // Validates updated category data
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
    // Handles a category ID that does not exist
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return response.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Handles duplicate category names
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return response.status(409).json({
        success: false,
        error: "Category name already exists",
      });
    }

    throw error;
  }
});

// Deletes a category
categoryRouter.delete("/:id", async (request, response) => {
  const parsedParams = categoryIdSchema.safeParse(request.params);

  // Validates category ID
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
    // Handles a category ID that does not exist
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return response.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Prevents deleting categories that still contain products
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return response.status(409).json({
        success: false,
        error: "Cannot delete a category that still has products",
      });
    }

    throw error;
  }
});