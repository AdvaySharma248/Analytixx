import { Router } from "express";
import { z } from "zod";

import { createClearedSessionCookie, createSessionCookie, getSessionTokenFromRequest } from "../lib/auth.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import {
  createFirebaseSession,
  logoutUser,
} from "../services/auth-service.js";

const router = Router();

const firebaseSessionSchema = z.object({
  idToken: z.string().trim().min(1),
});

router.get(
  "/session",
  asyncHandler(async (request, response) => {
    if (!request.user) {
      response.json({ user: null });
      return;
    }

    response.json({ user: request.user });
  }),
);

router.post(
  "/firebase/session",
  asyncHandler(async (request, response) => {
    const parsed = firebaseSessionSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(400, "Firebase ID token is required.", "FIREBASE_ID_TOKEN_REQUIRED");
    }

    const result = await createFirebaseSession(parsed.data);
    response.setHeader("Set-Cookie", createSessionCookie(result.sessionToken));
    response.json({
      message: "Authenticated",
      user: result.user,
    });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (request, response) => {
    await logoutUser(getSessionTokenFromRequest(request));
    response.setHeader("Set-Cookie", createClearedSessionCookie());
    response.json({ message: "Signed out" });
  }),
);

export default router;
