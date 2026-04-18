import type { Request, Response, NextFunction } from "express";
import { getSupabase } from "../db/supabase.js";

/**
 * Middleware que extrai o user do JWT do Supabase.
 * Popula req.userId e req.userEmail.
 */
export async function supabaseAuthMiddleware(
  req: Request & { userId?: string; userEmail?: string },
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(); // Sem token — continua sem user
    return;
  }

  const token = header.slice(7);
  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    if (!error && user) {
      req.userId = user.id;
      req.userEmail = user.email;
    }
  } catch {
    // Token inválido — continua sem user
  }
  next();
}
