import { Router } from "express";
import { getSupabase } from "../db/supabase.js";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    const { error } = await getSupabase().from("personas").select("id").limit(1);
    res.json({ ok: !error, service: "twitter-poster", db: error ? error.message : "ok" });
  } catch (e) {
    res.status(503).json({ ok: false, service: "twitter-poster", db: e instanceof Error ? e.message : "unreachable" });
  }
});

export default router;
