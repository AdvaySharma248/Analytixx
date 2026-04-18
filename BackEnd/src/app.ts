import express from "express";

import { errorHandler, notFoundHandler } from "./lib/errors.js";
import datasetsRouter from "./routes/datasets.js";
import historyRouter from "./routes/history.js";
import metadataRouter from "./routes/metadata.js";
import queryRouter from "./routes/query.js";
import rootRouter from "./routes/root.js";
import uploadRouter from "./routes/upload.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", rootRouter);
  app.use("/api/datasets", datasetsRouter);
  app.use("/api/history", historyRouter);
  app.use("/api/metadata", metadataRouter);
  app.use("/api/query", queryRouter);
  app.use("/api/upload", uploadRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

