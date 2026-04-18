import { Router } from "express";
import { z } from "zod";
import { asyncHandler, httpError } from "../middleware/errorHandler.js";
import { sanitizeHandle } from "../util/validate.js";
import { collectLikes, collectFromProfile } from "../browser/collect.js";
import { syncWatchlistAccounts } from "../jobs/syncWatchlist.js";

const router = Router();

const syncBody = z.object({
  maxScrolls: z.coerce.number().min(1).max(50).default(8),
  maxTweets: z.coerce.number().min(1).max(500).default(80),
});

router.post(
  "/sync/likes",
  asyncHandler(async (req, res) => {
    const opts = syncBody.parse(req.body ?? {});
    const r = await collectLikes({ maxScrolls: opts.maxScrolls, maxTweets: opts.maxTweets });
    res.json(r);
  }),
);

router.post(
  "/sync/profile/:handle",
  asyncHandler(async (req, res) => {
    const rawHandle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;
    const handle = sanitizeHandle(rawHandle ?? "");
    if (!handle) throw httpError(400, "Handle inválido.");
    const opts = syncBody.parse(req.body ?? {});
    const r = await collectFromProfile(handle, { maxScrolls: opts.maxScrolls, maxTweets: opts.maxTweets });
    res.json(r);
  }),
);

router.post(
  "/sync/watchlist",
  asyncHandler(async (_req, res) => {
    const r = await syncWatchlistAccounts();
    res.json(r);
  }),
);

export default router;
