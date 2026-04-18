import { Router } from "express";
import multer from "multer";

import { env } from "../config/env.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import { ingestDataset } from "../services/dataset-service.js";
import { getTempUploadsRoot } from "../services/storage-service.js";

const router = Router();

const upload = multer({
  dest: getTempUploadsRoot(),
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_request, file, callback) => {
    // Phase 1 Security: Validate MIME type (text/csv only). Do NOT trust file extension.
    if (file.mimetype !== "text/csv") {
      callback(new AppError(400, "Only CSV files are supported. Invalid MIME type.", "INVALID_FILE_TYPE"));
      return;
    }

    callback(null, true);
  },
});

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      throw new AppError(400, "No file provided.", "FILE_REQUIRED");
    }
    if (request.file.size === 0) {
      throw new AppError(400, "Empty file provided.", "EMPTY_FILE");
    }

    const dataset = await ingestDataset(request.user!.id, request.file);
    response.status(201).json(dataset);
  }),
);

export default router;

