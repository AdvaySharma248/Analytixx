import { resolve } from "node:path";

import { z } from "zod";

const booleanFlag = z
  .union([z.literal("true"), z.literal("false")])
  .default("false")
  .transform((value) => value === "true");

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().trim().min(1).optional());

const originList = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const origins = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : undefined;
}, z.array(z.string().url()).optional());

const trustProxySetting = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}, z.union([z.boolean(), z.number().int().nonnegative(), z.string().trim().min(1)]).optional());

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  HOST: optionalString,
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
  FRONTEND_ORIGIN: z.string().url().default("http://127.0.0.1:3000"),
  CORS_ALLOWED_ORIGINS: originList,
  COOKIE_DOMAIN: optionalString,
  TRUST_PROXY: trustProxySetting,
  EMAIL_FROM: z.string().trim().min(1).default("Analytixx <no-reply@analytixx.local>"),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanFlag,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  AUTH_SESSION_COOKIE_NAME: z.string().trim().min(1).default("analytixx_session"),
  AUTH_SESSION_TTL_HOURS: z.coerce.number().positive().default(24 * 7),
  VERIFY_TOKEN_TTL_HOURS: z.coerce.number().positive().default(24),
  FIREBASE_API_KEY: z.string().trim().min(1).optional(),
  FIREBASE_AUTH_DOMAIN: z.string().trim().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().trim().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().trim().min(1).optional(),
  FIREBASE_MESSAGING_SENDER_ID: z.string().trim().min(1).optional(),
  FIREBASE_APP_ID: z.string().trim().min(1).optional(),
  FIREBASE_MEASUREMENT_ID: z.string().trim().min(1).optional(),
  DATA_STORAGE_DIR: z.string().trim().min(1).default("storage"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const data = parsed.data;
const isProduction = data.NODE_ENV === "production";

if ((data.SMTP_USER && !data.SMTP_PASS) || (!data.SMTP_USER && data.SMTP_PASS)) {
  throw new Error(
    "Invalid environment configuration: SMTP_USER and SMTP_PASS must both be provided together.",
  );
}

const allowedOrigins = new Set<string>([data.FRONTEND_ORIGIN, ...(data.CORS_ALLOWED_ORIGINS ?? [])]);

if (!isProduction) {
  allowedOrigins.add("http://127.0.0.1:3000");
  allowedOrigins.add("http://localhost:3000");
}

export const env = {
  ...data,
  isProduction,
  host: data.HOST ?? (isProduction ? "0.0.0.0" : "127.0.0.1"),
  trustProxy: data.TRUST_PROXY ?? (isProduction ? 1 : false),
  cookieDomain: data.COOKIE_DOMAIN ?? undefined,
  allowedOrigins: Array.from(allowedOrigins),
  storageRoot: resolve(process.cwd(), data.DATA_STORAGE_DIR),
  maxUploadBytes: Math.round(data.MAX_UPLOAD_SIZE_MB * 1024 * 1024),
  authSessionTtlMs: Math.round(data.AUTH_SESSION_TTL_HOURS * 60 * 60 * 1000),
  verifyTokenTtlMs: Math.round(data.VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000),
};
