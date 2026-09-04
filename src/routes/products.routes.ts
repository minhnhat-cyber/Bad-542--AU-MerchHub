import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";

export const productRouter = Router();

// Creates a new product
productRouter.post("/", async (request, response) => {
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
        name: parsedBody.data.name,
        description: parsedBody.data.description,
        price: parsedBody.data.price,
        stock: parsedBody.data.stock,
        imageUrl: parsedBody.data.imageUrl,
        departmentCode: parsedBody.data.departmentCode,
        categoryId: parsedBody.data.categoryId,
        isActive: parsedBody.data.isActive ?? true,
      },
    });

    return response.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2003"
        ) {
        return response.status(400).json({
        success: false,
        error: "Category does not exist",
      });
    }

    throw error;
  }
});

// Gets all products
productRouter.get("/", async (_request, response) => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return response.status(200).json({
    success: true,
    data: products,
  });
});

// Gets one product by ID
productRouter.get("/:id", async (request, response) => {
  const parsedParams = productIdSchema.safeParse(request.params);

  // Validates the product ID
  if (!parsedParams.success) {
    return response.status(400).json({
      success: false,
      error: z.treeifyError(parsedParams.error),
    });
  }

  const product = await prisma.product.findUnique({
    where: {
      id: parsedParams.data.id,
    },
    include: {
      category: true,
    },
  });

  // Handles a product that does not exist
  if (!product) {
    return response.status(404).json({
      success: false,
      error: "Product not found",
    });
  }

  return response.status(200).json({
    success: true,
    data: product,
  });
});

// Updates an existing product
productRouter.patch("/:id", async (request, response) => {
  const parsedParams = productIdSchema.safeParse(request.params);
  const parsedBody = updateProductSchema.safeParse(request.body);

  // Validates the product ID
  if (!parsedParams.success) {
    return response.status(400).json({
      success: false,
      error: z.treeifyError(parsedParams.error),
    });
  }

  // Validates the updated product data
  if (!parsedBody.success) {
    return response.status(400).json({
      success: false,
      error: z.treeifyError(parsedBody.error),
    });
  }

  try {
    const product = await prisma.product.update({
      where: {
        id: parsedParams.data.id,
      },
      data: parsedBody.data,
    });

    return response.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // Handles a product that does not exist
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return response.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Handles an invalid category ID
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return response.status(400).json({
        success: false,
        error: "Category does not exist",
      });
    }

    throw error;
  }
});

// Soft deletes a product by marking it as inactive (stop offering, while still keeping its database record for history)
productRouter.delete("/:id", async (request, response) => {
  const parsedParams = productIdSchema.safeParse(request.params);

  // Validates the product ID
  if (!parsedParams.success) {
    return response.status(400).json({
      success: false,
      error: z.treeifyError(parsedParams.error),
    });
  }

  try {
    await prisma.product.update({
      where: {
        id: parsedParams.data.id,
      },
      data: {
        isActive: false,
      },
    });

    return response.status(204).send();
  } catch (error) {
    // Handles a product that does not exist
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return response.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    throw error;
  }
});