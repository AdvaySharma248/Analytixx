import { createHash, randomBytes } from "node:crypto";

import type { Request } from "express";

import { env } from "../config/env.js";

function encodeCookieValue(value: string) {
  return encodeURIComponent(value);
}

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, chunk) => {
    const [rawName, ...rawValueParts] = chunk.trim().split("=");
    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join("="));
    return cookies;
  }, {});
}

export function getSessionTokenFromRequest(request: Request) {
  const cookies = parseCookies(request.headers.cookie);
  return cookies[env.AUTH_SESSION_COOKIE_NAME] ?? null;
}

export function createSessionCookie(token: string) {
  const maxAgeSeconds = Math.floor(env.authSessionTtlMs / 1000);
  const parts = [
    `${env.AUTH_SESSION_COOKIE_NAME}=${encodeCookieValue(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    "Priority=High",
  ];

  if (env.cookieDomain) {
    parts.push(`Domain=${env.cookieDomain}`);
  }

  if (env.isProduction) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function createClearedSessionCookie() {
  const parts = [
    `${env.AUTH_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Priority=High",
  ];

  if (env.cookieDomain) {
    parts.push(`Domain=${env.cookieDomain}`);
  }

  if (env.isProduction) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
