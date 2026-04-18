import { Router } from "express";
import { listEvents, getCollectionStats, listEventsBySource } from "../db/repositories/events.repo.js";
import { parsePagination } from "../util/pagination.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/events", asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req, 500);
  const source = req.query.source as string | undefined;
  const result = source
    ? await listEventsBySource(source, limit, offset)
    : await listEvents(limit, offset);
  res.json({ ...result, page, limit });
}));

router.get("/events/stats", asyncHandler(async (_req, res) => {
  res.json(await getCollectionStats());
}));

export default router;
