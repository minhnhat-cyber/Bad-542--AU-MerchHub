import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  AuthError,
  verifyApplicationToken,
} from "../services/auth.service.js";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    response.status(401).json({
      success: false,
      error: "Bearer token is required",
    });
    return;
  }

  try {
    const tokenClaims = await verifyApplicationToken(match[1]);
    const user = await prisma.user.findUnique({
      where: { id: tokenClaims.userId },
      select: { email: true, role: true },
    });

    if (!user) {
      response.status(401).json({
        success: false,
        error: "The signed-in user no longer exists",
      });
      return;
    }

    request.auth = {
      userId: tokenClaims.userId,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      response.status(error.status).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};

export function requireRoles(...allowedRoles: Role[]): RequestHandler {
  return (request, response, next) => {
    if (!request.auth) {
      response.status(401).json({
        success: false,
        error: "Authentication is required",
      });
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      response.status(403).json({
        success: false,
        error: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
}
