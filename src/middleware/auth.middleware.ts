import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
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
    request.auth = await verifyApplicationToken(match[1]);
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
