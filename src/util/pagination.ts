import type { Request } from "express";

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export function parsePagination(req: Request, maxLimit = 100): PaginationParams {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(Math.max(1, Number(req.query.limit ?? 50)), maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
