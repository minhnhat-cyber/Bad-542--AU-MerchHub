import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { microsoftLoginSchema } from "../schemas/auth.schema.js";
import {
  AuthError,
  issueApplicationToken,
  verifyMicrosoftIdToken,
} from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post("/microsoft", async (request, response) => {
  const parsedBody = microsoftLoginSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return response.status(400).json({
      success: false,
      error: z.treeifyError(parsedBody.error),
    });
  }

  try {
    const identity = await verifyMicrosoftIdToken(parsedBody.data.idToken);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { microsoftId: identity.microsoftId },
          { email: identity.email },
        ],
      },
    });

    if (
      existingUser?.microsoftId &&
      existingUser.microsoftId !== identity.microsoftId
    ) {
      throw new AuthError(409, "Email is linked to another Microsoft identity");
    }

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            microsoftId: identity.microsoftId,
            email: identity.email,
            displayName: identity.displayName,
          },
        })
      : await prisma.user.create({
          data: identity,
        });

    const accessToken = await issueApplicationToken(user);

    return response.status(200).json({
      success: true,
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 3600,
        user,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return response.status(error.status).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth!.userId },
  });

  if (!user) {
    return response.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  return response.status(200).json({
    success: true,
    data: user,
  });
});
