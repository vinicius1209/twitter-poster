import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { asyncHandler, httpError } from "../middleware/errorHandler.js";
import { supabaseUrl, supabaseKey, dbProvider } from "../config.js";

const router = Router();

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const authBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/auth/signup",
  asyncHandler(async (req, res) => {
    if (!supabase || dbProvider !== "supabase") {
      throw httpError(400, "Auth requer DB_PROVIDER=supabase.");
    }

    const { email, password } = authBody.parse(req.body);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw httpError(400, error.message);

    res.json({
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session,
    });
  }),
);

router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    if (!supabase || dbProvider !== "supabase") {
      throw httpError(400, "Auth requer DB_PROVIDER=supabase.");
    }

    const { email, password } = authBody.parse(req.body);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw httpError(401, error.message);

    res.json({
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session,
    });
  }),
);

router.get(
  "/auth/me",
  asyncHandler(async (req, res) => {
    if (!supabase || dbProvider !== "supabase") {
      res.json({ user: null, mode: "local" });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.json({ user: null });
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(header.slice(7));
    if (error || !user) {
      res.json({ user: null });
      return;
    }

    res.json({ user: { id: user.id, email: user.email } });
  }),
);

export default router;
