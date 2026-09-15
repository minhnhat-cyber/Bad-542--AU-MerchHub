import { Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  updateUserRoleSchema,
  userIdSchema,
} from "../schemas/admin.schema.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles(Role.ADMIN));

adminRouter.get("/users", async (_request, response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return response.status(200).json({ success: true, data: users });
});

adminRouter.patch("/users/:id/role", async (request, response) => {
  const parsedParams = userIdSchema.safeParse(request.params);
  const parsedBody = updateUserRoleSchema.safeParse(request.body);

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

  if (
    parsedParams.data.id === request.auth!.userId &&
    parsedBody.data.role !== Role.ADMIN
  ) {
    return response.status(409).json({
      success: false,
      error: "Administrators cannot remove their own admin access",
    });
  }

  try {
    const user = await prisma.user.update({
      where: { id: parsedParams.data.id },
      data: { role: parsedBody.data.role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return response.status(200).json({ success: true, data: user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return response.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    throw error;
  }
});
