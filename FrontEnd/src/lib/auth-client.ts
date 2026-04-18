'use client';

import {
  createUserWithEmailAndPassword,
  getIdToken,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as signOutFromFirebase,
  updateProfile,
} from "firebase/auth";

import { getFirebaseAuthClient } from "./firebase-auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
};

type ApiResponse<T> = {
  error?: string;
  code?: string;
} & T;

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {} as ApiResponse<T>;
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error('The server returned an invalid response. Please try again.');
  }
}

async function request<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseResponse<T>(response);

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
}

function requireFirebaseAuth() {
  const auth = getFirebaseAuthClient();

  if (!auth) {
    throw new Error("Firebase authentication is not configured in this app.");
  }

  return auth;
}

function getFirebaseActionUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:3000/verify?source=firebase";
  }

  return `${window.location.origin}/verify?source=firebase`;
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code)
    : null;
}

function toAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    const knownClientMessages = new Set([
      "Please verify your email first.",
      "Firebase authentication is not configured in this app.",
    ]);

    if (knownClientMessages.has(error.message)) {
      return error.message;
    }
  }

  switch (getErrorCode(error)) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again in a moment.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Firebase Email/Password sign-in is not enabled for this project.";
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return "Firebase email verification is not configured for this domain yet.";
    default:
      return error instanceof Error && error.message ? error.message : fallback;
  }
}

function isUnauthorizedContinueUrlError(error: unknown) {
  const code = getErrorCode(error);
  return code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri";
}

async function createBackendSessionFromFirebaseIdToken(idToken: string) {
  return request<{ message: string; user: SessionUser }>("/api/auth/firebase/session", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function fetchCurrentSession() {
  const payload = await request<{ user: SessionUser | null }>('/api/auth/session', {
    method: 'GET',
    cache: 'no-store',
  });

  return payload.user ?? null;
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}) {
  const auth = requireFirebaseAuth();

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password,
    );

    if (input.name.trim().length > 0) {
      await updateProfile(credential.user, {
        displayName: input.name.trim(),
      });
    }

    try {
      await sendEmailVerification(credential.user, {
        url: getFirebaseActionUrl(),
      });
    } catch (error) {
      if (!isUnauthorizedContinueUrlError(error)) {
        throw error;
      }

      // Fallback to Firebase's default verification handler when the current
      // domain has not been added to Authorized domains in Firebase Auth yet.
      await sendEmailVerification(credential.user);
    }
    await signOutFromFirebase(auth);

    return {
      message: "Verification email sent. Please check your inbox.",
      previewUrl: null,
      verificationUrl: null,
    };
  } catch (error) {
    throw new Error(toAuthErrorMessage(error, "Sign up failed."));
  }
}

export async function signInWithEmail(input: { email: string; password: string }) {
  const auth = requireFirebaseAuth();

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password,
    );
    await reload(credential.user);

    if (!credential.user.emailVerified) {
      await signOutFromFirebase(auth);
      throw new Error("Please verify your email first.");
    }

    const idToken = await getIdToken(credential.user, true);

    try {
      return await createBackendSessionFromFirebaseIdToken(idToken);
    } catch (error) {
      await signOutFromFirebase(auth);
      throw error;
    }
  } catch (error) {
    throw new Error(toAuthErrorMessage(error, "Sign in failed."));
  }
}

export async function signOutFromSession() {
  const auth = getFirebaseAuthClient();
  const [logoutResult] = await Promise.allSettled([
    request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    }),
    auth ? signOutFromFirebase(auth) : Promise.resolve(),
  ]);

  if (logoutResult.status === "rejected") {
    throw logoutResult.reason;
  }

  return logoutResult.value;
}

export async function verifyEmailAddress(token: string) {
  return request<{ message: string; user: SessionUser }>(
    `/api/auth/verify?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );
}
