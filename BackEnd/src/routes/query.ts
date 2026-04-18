import { Router } from "express";
import { z } from "zod";

import { AppError, asyncHandler } from "../lib/errors.js";
import { runQuery } from "../services/analytics-service.js";

const router = Router();

const queryBodySchema = z.object({
  datasetId: z.string().min(1),
  question: z.string().trim().min(1).max(500),
});

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = queryBodySchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(400, "Dataset ID and question are required.", "INVALID_QUERY_BODY");
    }

    const result = await runQuery(parsed.data.datasetId, parsed.data.question);
    response.json(result);
  }),
);

export default router;

