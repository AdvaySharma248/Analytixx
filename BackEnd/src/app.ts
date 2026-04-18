import express from "express";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { attachAuthenticatedUser, requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import datasetsRouter from "./routes/datasets.js";
import historyRouter from "./routes/history.js";
import metadataRouter from "./routes/metadata.js";
import queryRouter from "./routes/query.js";
import rootRouter from "./routes/root.js";
import uploadRouter from "./routes/upload.js";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(env.allowedOrigins);

  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxy);
  app.use((request, response, next) => {
    response.header("X-Content-Type-Options", "nosniff");
    response.header("X-Frame-Options", "DENY");
    response.header("Referrer-Policy", "strict-origin-when-cross-origin");
    response.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (env.isProduction && request.secure) {
      response.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(attachAuthenticatedUser);
  app.use((request, response, next) => {
    const requestOrigin = typeof request.headers.origin === "string" ? request.headers.origin : null;
    const requestedHeaders = request.headers["access-control-request-headers"];
    const allowedHeaders = Array.isArray(requestedHeaders)
      ? requestedHeaders.join(", ")
      : requestedHeaders ?? "Content-Type, Authorization";

    if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
      response.status(403).json({
        error: "Origin not allowed.",
        code: "CORS_ORIGIN_DENIED",
      });
      return;
    }

    if (requestOrigin) {
      response.header("Access-Control-Allow-Origin", requestOrigin);
      response.append("Vary", "Origin");
      response.header("Access-Control-Allow-Credentials", "true");
      response.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      response.header("Access-Control-Allow-Headers", allowedHeaders);
      response.header("Access-Control-Max-Age", "86400");
    }

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use("/api", rootRouter);
  app.use("/api/auth", (_request, response, next) => {
    response.header("Cache-Control", "no-store");
    next();
  }, authRouter);
  app.use("/api/datasets", requireAuth, datasetsRouter);
  app.use("/api/history", requireAuth, historyRouter);
  app.use("/api/metadata", requireAuth, metadataRouter);
  app.use("/api/query", requireAuth, queryRouter);
  app.use("/api/upload", requireAuth, uploadRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

