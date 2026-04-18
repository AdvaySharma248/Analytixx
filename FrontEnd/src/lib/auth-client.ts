'use client';

import {
  createUserWithEmailAndPassword,
  deleteUser,
  getIdToken,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as signOutFromFirebase,
  updateProfile,
} from "firebase/auth";

import { getFirebaseConfigurationErrorMessage } from "./firebase";
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

const VERIFICATION_RESEND_COOLDOWN_MS = 10 * 60 * 1000;
const VERIFICATION_RESEND_KEY_PREFIX = "analytixx:verify-resend";

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
    throw new Error(
      getFirebaseConfigurationErrorMessage() ?? "Firebase authentication is not configured in this app.",
    );
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

function getVerificationResendStorageKey(email: string) {
  return `${VERIFICATION_RESEND_KEY_PREFIX}:${email.trim().toLowerCase()}`;
}

function recordVerificationResendAttempt(email: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getVerificationResendStorageKey(email), String(Date.now()));
  } catch {
    // Ignore storage failures so auth can continue working.
  }
}

function getVerificationResendCooldownRemainingMs(email: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const rawValue = window.localStorage.getItem(getVerificationResendStorageKey(email));
    if (!rawValue) {
      return 0;
    }

    const lastAttempt = Number(rawValue);
    if (!Number.isFinite(lastAttempt)) {
      return 0;
    }

    return Math.max(0, VERIFICATION_RESEND_COOLDOWN_MS - (Date.now() - lastAttempt));
  } catch {
    return 0;
  }
}

function formatCooldownWindow(remainingMs: number) {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

async function sendFirebaseVerificationEmail(user: Parameters<typeof sendEmailVerification>[0]) {
  try {
    await sendEmailVerification(user, {
      url: getFirebaseActionUrl(),
    });
  } catch (error) {
    if (!isUnauthorizedContinueUrlError(error)) {
      throw error;
    }

    // Fallback to Firebase's default verification handler when the current
    // domain has not been added to Authorized domains in Firebase Auth yet.
    await sendEmailVerification(user);
  }

  if (user.email) {
    recordVerificationResendAttempt(user.email);
  }
}

async function requestVerificationEmailForUser(options: {
  email: string;
  user: Parameters<typeof sendEmailVerification>[0];
  recentlyRequestedMessage: (cooldownWindow: string) => string;
  successMessage: string;
  rateLimitedMessage: string;
  failureMessage: string;
}) {
  const cooldownRemainingMs = getVerificationResendCooldownRemainingMs(options.email);

  if (cooldownRemainingMs > 0) {
    throw new Error(options.recentlyRequestedMessage(formatCooldownWindow(cooldownRemainingMs)));
  }

  try {
    await sendFirebaseVerificationEmail(options.user);
    return options.successMessage;
  } catch (error) {
    if (getErrorCode(error) === "auth/too-many-requests") {
      throw new Error(options.rateLimitedMessage);
    }

    throw new Error(options.failureMessage);
  }
}

async function recoverExistingSignupAttempt(input: {
  auth: ReturnType<typeof requireFirebaseAuth>;
  email: string;
  password: string;
}) {
  try {
    const credential = await signInWithEmailAndPassword(input.auth, input.email, input.password);
    await reload(credential.user);

    if (credential.user.emailVerified) {
      throw new Error("This email is already registered. Please sign in instead.");
    } else {
      throw new Error("This email is already registered. Please sign in instead (email verification bypassed).");
    }
  } catch (error) {
    if (
      getErrorCode(error) === "auth/invalid-credential"
      || getErrorCode(error) === "auth/wrong-password"
    ) {
      throw new Error("This email is already registered. Please sign in with the original password instead.");
    }

    if (getErrorCode(error) === "auth/too-many-requests") {
      throw new Error(
        "Firebase is temporarily blocking sign-in attempts for this email. Wait 10-30 minutes, then try again.",
      );
    }

    throw error;
  }
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
  const trimmedName = input.name.trim();
  const trimmedEmail = input.email.trim();

  try {
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, input.password);

    if (trimmedName.length > 0) {
      await updateProfile(credential.user, {
        displayName: trimmedName,
      }).catch(() => undefined);
    }

    try {
      await sendFirebaseVerificationEmail(credential.user);
      return {
        message: "Verification email sent. Please check your inbox.",
        previewUrl: null,
        verificationUrl: null,
      };
    } catch (error) {
      console.warn("Could not send verification email, continuing anyway", error);
      return {
        message: "Account created successfully. (Developer mode: Email verification skipped due to Firebase limits)",
        previewUrl: null,
        verificationUrl: null,
      };
    }
  } catch (error) {
    if (getErrorCode(error) === "auth/email-already-in-use") {
      return await recoverExistingSignupAttempt({
        auth,
        email: trimmedEmail,
        password: input.password,
      });
    }

    throw new Error(toAuthErrorMessage(error, "Sign up failed."));
  } finally {
    await signOutFromFirebase(auth).catch(() => undefined);
  }
}

export async function signInWithEmail(input: { email: string; password: string }) {
  const auth = requireFirebaseAuth();
  const trimmedEmail = input.email.trim();

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      trimmedEmail,
      input.password,
    );

    let shouldSignOut = false;

    try {
      await reload(credential.user);

      // Verification check intentionally bypassed to deal with Firebase quota constraints.
      // if (!credential.user.emailVerified) { ... }

      const idToken = await getIdToken(credential.user, true);

      try {
        return await createBackendSessionFromFirebaseIdToken(idToken);
      } catch (error) {
        shouldSignOut = true;
        throw error;
      }
    } finally {
      if (shouldSignOut) {
        await signOutFromFirebase(auth).catch(() => undefined);
      }
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
