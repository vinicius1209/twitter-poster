import { Router } from "express";
import { getSupabase } from "../db/supabase.js";

const router = Router();

router.get("/plans", async (_req, res) => {
  const { data, error } = await getSupabase().from("plans").select("*").order("price_brl", { ascending: true });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
