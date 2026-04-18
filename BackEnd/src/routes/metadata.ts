import { Router } from "express";

import { AppError, asyncHandler } from "../lib/errors.js";
import { getDatasetMetadata } from "../services/dataset-service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const datasetId = request.query.datasetId;

    if (typeof datasetId !== "string" || datasetId.trim().length === 0) {
      throw new AppError(400, "datasetId is required.", "DATASET_ID_REQUIRED");
    }

    response.json(await getDatasetMetadata(request.user!.id, datasetId));
  }),
);

export default router;

