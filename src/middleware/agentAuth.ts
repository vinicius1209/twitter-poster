import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { agentToken } from "../config.js";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function requireAgentAuth(req: Request, res: Response, next: NextFunction): void {
  if (!agentToken) { next(); return; }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Agent token ausente." });
    return;
  }

  if (!safeCompare(header.slice(7), agentToken)) {
    res.status(403).json({ error: "Agent token inválido." });
    return;
  }

  next();
}
