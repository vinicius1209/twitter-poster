import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { apiToken } from "../config.js";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!apiToken) { next(); return; }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token ausente." });
    return;
  }

  if (!safeCompare(header.slice(7), apiToken)) {
    res.status(403).json({ error: "Token inválido." });
    return;
  }

  next();
}
