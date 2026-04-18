import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();

router.get("/plans", (_req, res) => {
  const plans = getDb()
    .prepare("SELECT * FROM plans ORDER BY price_brl ASC")
    .all();
  res.json(plans);
});

export default router;
