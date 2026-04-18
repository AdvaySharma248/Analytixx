import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from "../lib/auth.js";
import { env } from "../config/env.js";
import { ensureMailDeliveryReady, sendVerificationEmail } from "./mail-service.js";

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

function createVerificationToken() {
  const plainToken = createOpaqueToken();

  return {
    plainToken,
    tokenHash: hashOpaqueToken(plainToken),
    expiresAt: new Date(Date.now() + env.verifyTokenTtlMs),
  };
}

export async function signUpUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const requiresEmailVerification = env.emailVerificationEnabled;

  if (requiresEmailVerification) {
    await ensureMailDeliveryReady();
  }

  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const passwordHash = await hashPassword(input.password);
  const verificationToken = requiresEmailVerification ? createVerificationToken() : null;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  let userId: string;

  if (existingUser?.isVerified) {
    throw new AppError(
      409,
      "An account with this email already exists.",
      "EMAIL_ALREADY_IN_USE",
    );
  }

  if (existingUser) {
    const updatedUser = await db.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        isVerified: !requiresEmailVerification,
        verificationTokens: verificationToken
          ? {
              deleteMany: {},
              create: {
                tokenHash: verificationToken.tokenHash,
                expiresAt: verificationToken.expiresAt,
              },
            }
          : {
              deleteMany: {},
            },
      },
    });
    userId = updatedUser.id;
  } else {
    const createdUser = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        isVerified: !requiresEmailVerification,
        ...(verificationToken
          ? {
              verificationTokens: {
                create: {
                  tokenHash: verificationToken.tokenHash,
                  expiresAt: verificationToken.expiresAt,
                },
              },
            }
          : {}),
      },
    });
    userId = createdUser.id;
  }

  if (!requiresEmailVerification || !verificationToken) {
    return {
      userId,
      message: "Account created. You can now sign in.",
      deliveryMode: null,
      previewUrl: null,
      verificationUrl: null,
    };
  }

  const mailResult = await sendVerificationEmail({
    email,
    name: getDisplayName(name, email),
    token: verificationToken.plainToken,
  });

  return {
    userId,
    message: "Verification email sent. Please check your inbox.",
    deliveryMode: mailResult.deliveryMode,
    previewUrl: mailResult.previewUrl,
    verificationUrl:
      (env.isProduction || env.isHostedEnvironment) && mailResult.deliveryMode === "smtp"
        ? null
        : mailResult.verificationUrl,
  };
}

export async function verifyUserEmail(token: string) {
  const tokenHash = hashOpaqueToken(token);
  const verificationToken = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!verificationToken) {
    throw new AppError(400, "Invalid or expired verification link.", "INVALID_VERIFY_TOKEN");
  }

  if (verificationToken.expiresAt.getTime() < Date.now()) {
    await db.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    throw new AppError(400, "Invalid or expired verification link.", "INVALID_VERIFY_TOKEN");
  }

  await db.$transaction([
    db.user.update({
      where: { id: verificationToken.userId },
      data: {
        isVerified: true,
      },
    }),
    db.emailVerificationToken.deleteMany({
      where: {
        userId: verificationToken.userId,
      },
    }),
  ]);

  return toSafeUser(verificationToken.user);
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  let user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  if (env.emailVerificationEnabled && !user.isVerified) {
    throw new AppError(403, "Please verify your email first.", "EMAIL_NOT_VERIFIED");
  }

  if (!env.emailVerificationEnabled && !user.isVerified) {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokens: {
          deleteMany: {},
        },
      },
    });
  }

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

  if (env.emailVerificationEnabled && !session.user.isVerified) {
    await db.authSession.delete({
      where: {
        id: session.id,
      },
    });
    return null;
  }

  const user = !env.emailVerificationEnabled && !session.user.isVerified
    ? await db.user.update({
        where: { id: session.user.id },
        data: {
          isVerified: true,
          verificationTokens: {
            deleteMany: {},
          },
        },
      })
    : session.user;

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: toSafeUser(user),
  };
}
