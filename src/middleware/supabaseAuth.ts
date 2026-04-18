import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey, dbProvider } from "../config.js";

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Middleware que extrai o user do JWT do Supabase.
 * Só ativo quando DB_PROVIDER=supabase.
 * Popula req.userId e req.userEmail.
 */
export async function supabaseAuthMiddleware(
  req: Request & { userId?: string; userEmail?: string },
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Se não é Supabase, passa direto (modo local)
  if (dbProvider !== "supabase" || !supabase) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token ausente." });
    return;
  }

  const token = header.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Token inválido ou expirado." });
    return;
  }

  req.userId = user.id;
  req.userEmail = user.email;
  next();
}
