import { Router } from "express";
import { asyncHandler, httpError } from "../middleware/errorHandler.js";
import { sanitizeHandle } from "../util/validate.js";
import { analyzeProfile } from "../jobs/profileStudy.js";

const router = Router();

router.get(
  "/profile-study/:handle",
  asyncHandler(async (req, res) => {
    const rawHandle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;
    const handle = sanitizeHandle(rawHandle ?? "");
    if (!handle) throw httpError(400, "Handle inválido.");
    const study = await analyzeProfile(handle);
    res.json(study);
  }),
);

export default router;
