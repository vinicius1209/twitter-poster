import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Error handler centralizado — captura erros de qualquer rota.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const status =
    err instanceof Error && "status" in err
      ? (err as Error & { status: number }).status
      : 500;
  res.status(status).json({ error: message });
}

/**
 * Wrapper para rotas async — captura rejeições e passa para o error handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Cria um erro com status HTTP.
 */
export function httpError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
