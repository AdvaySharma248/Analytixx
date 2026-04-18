import { Router } from "express";

import { asyncHandler } from "../lib/errors.js";
import { listQueryHistory } from "../services/dataset-service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json(await listQueryHistory());
  }),
);

export default router;

