import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export type FirebaseIdTokenClaims = {
  uid: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
};

type FirebaseIdTokenVerifier = (idToken: string) => Promise<FirebaseIdTokenClaims>;

const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

let verifierOverride: FirebaseIdTokenVerifier | null = null;

export function setFirebaseIdTokenVerifierForTests(verifier: FirebaseIdTokenVerifier | null) {
  if (env.NODE_ENV !== "test") {
    throw new Error("Firebase token verifier overrides are only available in test mode.");
  }

  verifierOverride = verifier;
}

function getFirebaseProjectId() {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new AppError(
      503,
      "Firebase authentication is not configured on the server. Set FIREBASE_PROJECT_ID.",
      "FIREBASE_AUTH_NOT_CONFIGURED",
    );
  }

  return env.FIREBASE_PROJECT_ID;
}

async function verifyFirebaseIdTokenWithJose(idToken: string): Promise<FirebaseIdTokenClaims> {
  const projectId = getFirebaseProjectId();

  try {
    const { payload } = await jwtVerify(idToken, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid =
      typeof payload.user_id === "string"
        ? payload.user_id
        : typeof payload.sub === "string"
          ? payload.sub
          : null;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    const name = typeof payload.name === "string" ? payload.name.trim() : null;

    if (!uid || !email) {
      throw new AppError(
        401,
        "Invalid Firebase session. Please sign in again.",
        "INVALID_FIREBASE_TOKEN",
      );
    }

    return {
      uid,
      email,
      name: name && name.length > 0 ? name : null,
      emailVerified: payload.email_verified === true,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      401,
      "Invalid Firebase session. Please sign in again.",
      "INVALID_FIREBASE_TOKEN",
    );
  }
}

export async function verifyFirebaseIdToken(idToken: string) {
  const trimmedToken = idToken.trim();

  if (!trimmedToken) {
    throw new AppError(400, "Firebase ID token is required.", "FIREBASE_ID_TOKEN_REQUIRED");
  }

  if (verifierOverride) {
    return verifierOverride(trimmedToken);
  }

  return verifyFirebaseIdTokenWithJose(trimmedToken);
}
