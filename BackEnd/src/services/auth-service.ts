import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import {
  createOpaqueToken,
  hashOpaqueToken,
} from "../lib/auth.js";
import { env } from "../config/env.js";
import { verifyFirebaseIdToken } from "../lib/firebase-auth.js";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getDisplayName(name: string | null, email: string) {
  return name?.trim() || email.split("@")[0] || "User";
}

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
};

function toSafeUser(user: {
  id: string;
  email: string;
  name: string | null;
  isVerified: boolean;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: getDisplayName(user.name, user.email),
    isVerified: user.isVerified,
  };
}

async function createSessionForUser(user: {
  id: string;
  email: string;
  name: string | null;
  isVerified: boolean;
}) {
  const sessionToken = createOpaqueToken();
  const session = await db.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashOpaqueToken(sessionToken),
      expiresAt: new Date(Date.now() + env.authSessionTtlMs),
    },
  });

  return {
    user: toSafeUser(user),
    sessionToken,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };
}

export async function createFirebaseSession(input: { idToken: string }) {
  const claims = await verifyFirebaseIdToken(input.idToken);

  if (!claims.emailVerified) {
    throw new AppError(403, "Please verify your email first.", "EMAIL_NOT_VERIFIED");
  }

  const existingUser = await db.user.findUnique({
    where: { email: claims.email },
  });

  const user = existingUser
    ? await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: claims.name ?? existingUser.name,
          isVerified: true,
        },
      })
    : await db.user.create({
        data: {
          email: claims.email,
          name: claims.name,
          isVerified: true,
        },
      });

  return createSessionForUser(user);
}

export async function logoutUser(sessionToken: string | null) {
  if (!sessionToken) {
    return;
  }

  await db.authSession.deleteMany({
    where: {
      tokenHash: hashOpaqueToken(sessionToken),
    },
  });
}

export async function getUserFromSessionToken(sessionToken: string) {
  const session = await db.authSession.findUnique({
    where: {
      tokenHash: hashOpaqueToken(sessionToken),
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await db.authSession.delete({
      where: {
        id: session.id,
      },
    });
    return null;
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: toSafeUser(session.user),
  };
}
