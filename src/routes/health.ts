import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();

router.get("/health", (_req, res) => {
  try {
    const db = getDb();
    const check = db.pragma("integrity_check") as { integrity_check: string }[];
    const dbOk = check[0]?.integrity_check === "ok";
    res.json({ ok: dbOk, service: "twitter-poster", db: dbOk ? "ok" : "integrity_check failed" });
  } catch (e) {
    res.status(503).json({
      ok: false,
      service: "twitter-poster",
      db: e instanceof Error ? e.message : "unreachable",
    });
  }
});

export default router;
