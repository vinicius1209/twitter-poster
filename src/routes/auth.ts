import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getSupabase } from "../db/supabase.js";

const router = Router();

const authBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/auth/signup", asyncHandler(async (req, res) => {
  const { email, password } = authBody.parse(req.body);
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ user: { id: data.user?.id, email: data.user?.email }, session: data.session });
}));

router.post("/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = authBody.parse(req.body);
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) { res.status(401).json({ error: error.message }); return; }
  res.json({ user: { id: data.user?.id, email: data.user?.email }, session: data.session });
}));

router.get("/auth/me", asyncHandler(async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) { res.json({ user: null }); return; }
  const { data: { user }, error } = await getSupabase().auth.getUser(header.slice(7));
  if (error || !user) { res.json({ user: null }); return; }
  res.json({ user: { id: user.id, email: user.email } });
}));

export default router;
