import { Role } from "@prisma/client";
import {
  createRemoteJWKSet,
  jwtVerify,
  SignJWT,
  type JWTPayload,
} from "jose";
import { env } from "../config/env.js";

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function requireMicrosoftConfiguration() {
  if (!env.MICROSOFT_TENANT_ID || !env.MICROSOFT_CLIENT_ID) {
    throw new AuthError(503, "Microsoft authentication is not configured");
  }

  return {
    tenantId: env.MICROSOFT_TENANT_ID,
    clientId: env.MICROSOFT_CLIENT_ID,
  };
}

function requireJwtSecret() {
  if (!env.APP_JWT_SECRET) {
    throw new AuthError(503, "Application JWT signing is not configured");
  }

  return env.APP_JWT_SECRET;
}

export interface MicrosoftIdentity {
  microsoftId: string;
  email: string;
  displayName?: string;
}

export async function verifyMicrosoftIdToken(
  idToken: string,
): Promise<MicrosoftIdentity> {
  const { tenantId, clientId } = requireMicrosoftConfiguration();
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
  const keySet = createRemoteJWKSet(
    new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
  );

  try {
    const { payload } = await jwtVerify(idToken, keySet, {
      algorithms: ["RS256"],
      audience: clientId,
      issuer,
    });

    if (payload.tid !== tenantId) {
      throw new AuthError(401, "Microsoft tenant is not allowed");
    }

    const microsoftId =
      typeof payload.oid === "string" ? payload.oid : payload.sub;
    const rawEmail =
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : typeof payload.email === "string"
          ? payload.email
          : undefined;

    if (!microsoftId || !rawEmail || !rawEmail.includes("@")) {
      throw new AuthError(401, "Microsoft identity is missing required claims");
    }

    const email = rawEmail.toLowerCase();
    const allowedDomain = env.MICROSOFT_ALLOWED_EMAIL_DOMAIN?.toLowerCase();

    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      throw new AuthError(403, "A university Microsoft account is required");
    }

    return {
      microsoftId,
      email,
      displayName:
        typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError(401, "Microsoft ID token is invalid or expired");
  }
}

export interface ApplicationTokenClaims extends JWTPayload {
  email: string;
  role: Role;
}

export async function issueApplicationToken(user: {
  id: string;
  email: string;
  role: Role;
}) {
  const jwtSecret = requireJwtSecret();

  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(env.APP_JWT_ISSUER)
    .setAudience(env.APP_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

export async function verifyApplicationToken(
  token: string,
): Promise<{ userId: string; email: string; role: Role }> {
  const jwtSecret = requireJwtSecret();

  try {
    const { payload } = await jwtVerify<ApplicationTokenClaims>(
      token,
      new TextEncoder().encode(jwtSecret),
      {
        algorithms: ["HS256"],
        issuer: env.APP_JWT_ISSUER,
        audience: env.APP_JWT_AUDIENCE,
      },
    );

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      !Object.values(Role).includes(payload.role)
    ) {
      throw new AuthError(401, "Application token is missing required claims");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError(401, "Application token is invalid or expired");
  }
}
