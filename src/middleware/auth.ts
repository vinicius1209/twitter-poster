import type { Request, Response, NextFunction } from "express";
import { apiToken } from "../config.js";

/**
 * Middleware de autenticação via Bearer token.
 * Se API_TOKEN não estiver definido no .env, todas as requests passam (dev mode).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!apiToken) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token ausente. Envie Authorization: Bearer <token>" });
    return;
  }

  const token = header.slice(7);
  if (token !== apiToken) {
    res.status(403).json({ error: "Token inválido." });
    return;
  }

  next();
}
