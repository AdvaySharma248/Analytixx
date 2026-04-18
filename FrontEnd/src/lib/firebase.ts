import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const defaultFirebaseConfig = {
  apiKey: "AIzaSyB8z4Jho9mqFy3xszDpCjQIObtPT-DugT4",
  authDomain: "analytixx-1.firebaseapp.com",
  projectId: "analytixx-1",
  storageBucket: "analytixx-1.firebasestorage.app",
  messagingSenderId: "264021224506",
  appId: "1:264021224506:web:4f3407478901fa5ce5d903",
  measurementId: "G-9REEPPEKRW",
} as const;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? defaultFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? defaultFirebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? defaultFirebaseConfig.projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ?? defaultFirebaseConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? defaultFirebaseConfig.appId,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? defaultFirebaseConfig.measurementId,
};

const requiredFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredFirebaseConfig.every(
  (value) => typeof value === "string" && value.length > 0,
);

export const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

let analyticsPromise: Promise<Analytics | null> | null = null;

export function initializeFirebaseAnalytics() {
  if (!firebaseApp || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  analyticsPromise ??= isSupported()
    .then((supported) => {
      if (!supported) {
        return null;
      }

      return getAnalytics(firebaseApp);
    })
    .catch(() => null);

  return analyticsPromise;
}
