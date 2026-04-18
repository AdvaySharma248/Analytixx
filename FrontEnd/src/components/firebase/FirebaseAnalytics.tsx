"use client";

import { useEffect } from "react";

import { initializeFirebaseAnalytics, isFirebaseConfigured } from "@/lib/firebase";

export default function FirebaseAnalytics() {
  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    void initializeFirebaseAnalytics();
  }, []);

  return null;
}
