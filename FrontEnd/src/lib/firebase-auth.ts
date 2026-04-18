'use client';

import { getAuth, type Auth } from "firebase/auth";

import { firebaseApp } from "./firebase";

let authInstance: Auth | null | undefined;

export function getFirebaseAuthClient() {
  if (!firebaseApp || typeof window === "undefined") {
    return null;
  }

  authInstance ??= getAuth(firebaseApp);
  return authInstance;
}
