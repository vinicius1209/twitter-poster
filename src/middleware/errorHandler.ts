import type { Request, Response, NextFunction, RequestHandler } from "express";
import { logger } from "../lib/logger.js";
import { isProduction } from "../config.js";
import { z } from "zod";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: "Dados inválidos.",
      details: isProduction ? undefined : (err as any).issues ?? err.message,
    });
    return;
  }

  const isHttpError = err instanceof Error && "status" in err;
  const status = isHttpError ? (err as Error & { status: number }).status : 500;
  const message = err instanceof Error ? err.message : String(err);

  // Log server-side com detalhes completos
  logger.error({
    err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    method: req.method,
    url: req.url,
    status,
  }, `${req.method} ${req.url} → ${status}`);

  // Response ao client — sem stack trace em produção
  if (status >= 500) {
    res.status(status).json({
      error: isProduction ? "Erro interno do servidor." : message,
    });
  } else {
    res.status(status).json({ error: message });
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function httpError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
