import type { NextFunction, Request, Response } from "express";

import { getSessionTokenFromRequest } from "../lib/auth.js";
import { getUserFromSessionToken } from "../services/auth-service.js";

export async function attachAuthenticatedUser(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const sessionToken = getSessionTokenFromRequest(request);

    if (sessionToken) {
      const session = await getUserFromSessionToken(sessionToken);

      if (session) {
        request.user = session.user;
        request.session = {
          id: session.sessionId,
          userId: session.user.id,
          expiresAt: session.expiresAt.toISOString(),
        };
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  if (!request.user) {
    response.status(401).json({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
    return;
  }

  next();
}
