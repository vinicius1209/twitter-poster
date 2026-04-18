import { describe, it, expect } from "vitest";
import { parsePagination } from "../src/util/pagination.js";

function mockReq(query: Record<string, string>) {
  return { query } as any;
}

describe("parsePagination", () => {
  it("returns defaults when no params", () => {
    const p = parsePagination(mockReq({}));
    expect(p).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it("calculates offset correctly", () => {
    const p = parsePagination(mockReq({ page: "3", limit: "20" }));
    expect(p).toEqual({ page: 3, limit: 20, offset: 40 });
  });

  it("clamps limit to maxLimit", () => {
    const p = parsePagination(mockReq({ limit: "999" }), 100);
    expect(p.limit).toBe(100);
  });

  it("clamps page to minimum 1", () => {
    const p = parsePagination(mockReq({ page: "-5" }));
    expect(p.page).toBe(1);
    expect(p.offset).toBe(0);
  });
});
