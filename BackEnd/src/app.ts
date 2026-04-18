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
  const allowedOrigins = new Set([env.FRONTEND_ORIGIN]);

  if (env.NODE_ENV !== "production") {
    allowedOrigins.add("http://127.0.0.1:3000");
    allowedOrigins.add("http://localhost:3000");
  }

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(attachAuthenticatedUser);
  app.use((request, response, next) => {
    const requestOrigin = request.headers.origin;

    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
      response.header("Access-Control-Allow-Origin", requestOrigin);
      response.header("Vary", "Origin");
      response.header("Access-Control-Allow-Credentials", "true");
      response.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      response.header(
        "Access-Control-Allow-Headers",
        request.headers["access-control-request-headers"] ?? "Content-Type, Authorization",
      );
    }

    if (request.method === "OPTIONS") {
      response.sendStatus(requestOrigin && allowedOrigins.has(requestOrigin) ? 204 : 403);
      return;
    }

    next();
  });

  app.use("/api", rootRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/datasets", requireAuth, datasetsRouter);
  app.use("/api/history", requireAuth, historyRouter);
  app.use("/api/metadata", requireAuth, metadataRouter);
  app.use("/api/query", requireAuth, queryRouter);
  app.use("/api/upload", requireAuth, uploadRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

