import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ghostwrite } from "../jobs/ghostwriter.js";

const router = Router();

const ghostwriteBody = z.object({
  text: z.string().min(10),
  format: z.enum(["short", "long", "thread"]).default("short"),
  count: z.coerce.number().min(1).max(10).default(3),
  personaId: z.string().optional(),
});

router.post(
  "/ghostwrite",
  asyncHandler(async (req, res) => {
    const body = ghostwriteBody.parse(req.body);
    const result = await ghostwrite(body);
    res.json(result);
  }),
);

export default router;
