import type { Request, Response, NextFunction } from "express";
import { agentToken } from "../config.js";

export function requireAgentAuth(req: Request, res: Response, next: NextFunction): void {
  if (!agentToken) { next(); return; } // sem token configurado = dev mode

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Agent token ausente." });
    return;
  }
  if (header.slice(7) !== agentToken) {
    res.status(403).json({ error: "Agent token inválido." });
    return;
  }
  next();
}
