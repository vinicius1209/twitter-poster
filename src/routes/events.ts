import { Router } from "express";
import { listEvents, getCollectionStats, listEventsBySource } from "../db/repositories/events.repo.js";
import { parsePagination } from "../util/pagination.js";

const router = Router();

router.get("/events", (req, res) => {
  const { page, limit, offset } = parsePagination(req, 500);
  const source = req.query.source as string | undefined;
  if (source) {
    const { data, total } = listEventsBySource(source, limit, offset);
    res.json({ data, total, page, limit });
  } else {
    const { data, total } = listEvents(limit, offset);
    res.json({ data, total, page, limit });
  }
});

router.get("/events/stats", (_req, res) => {
  res.json(getCollectionStats());
});

export default router;
