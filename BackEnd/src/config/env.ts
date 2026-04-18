import { resolve } from "node:path";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
  DATA_STORAGE_DIR: z.string().trim().min(1).default("storage"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const data = parsed.data;

export const env = {
  ...data,
  host: "127.0.0.1",
  storageRoot: resolve(process.cwd(), data.DATA_STORAGE_DIR),
  maxUploadBytes: Math.round(data.MAX_UPLOAD_SIZE_MB * 1024 * 1024),
};
