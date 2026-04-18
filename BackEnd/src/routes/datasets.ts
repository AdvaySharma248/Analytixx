import { Router } from "express";

import { AppError, asyncHandler } from "../lib/errors.js";
import { deleteDataset, listDatasets } from "../services/dataset-service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json(await listDatasets());
  }),
);

router.delete(
  "/",
  asyncHandler(async (request, response) => {
    const datasetId = request.query.id;

    if (typeof datasetId !== "string" || datasetId.trim().length === 0) {
      throw new AppError(400, "Dataset ID is required.", "DATASET_ID_REQUIRED");
    }

    await deleteDataset(datasetId);
    response.json({ success: true });
  }),
);

export default router;

