import { Router } from "express";
import { z } from "zod";

import { createClearedSessionCookie, createSessionCookie, getSessionTokenFromRequest } from "../lib/auth.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import {
  loginUser,
  logoutUser,
  signUpUser,
  verifyUserEmail,
} from "../services/auth-service.js";

const router = Router();

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
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
  "/signup",
  asyncHandler(async (request, response) => {
    const parsed = signUpSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(400, "Name, email, and password are required.", "INVALID_SIGNUP_BODY");
    }

    const result = await signUpUser(parsed.data);
    response.status(201).json(result);
  }),
);

router.post(
  "/login",
  asyncHandler(async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(400, "Email and password are required.", "INVALID_LOGIN_BODY");
    }

    const result = await loginUser(parsed.data);
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

router.get(
  "/verify",
  asyncHandler(async (request, response) => {
    const token = request.query.token;

    if (typeof token !== "string" || token.trim().length === 0) {
      throw new AppError(400, "Verification token is required.", "VERIFY_TOKEN_REQUIRED");
    }

    const user = await verifyUserEmail(token);
    response.json({
      message: "Email verified successfully. You can now sign in.",
      user,
    });
  }),
);

export default router;
