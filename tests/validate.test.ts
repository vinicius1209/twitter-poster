import { describe, it, expect } from "vitest";
import { isValidHandle, sanitizeHandle } from "../src/util/validate.js";

describe("isValidHandle", () => {
  it("accepts valid handles", () => {
    expect(isValidHandle("elonmusk")).toBe(true);
    expect(isValidHandle("user_123")).toBe(true);
    expect(isValidHandle("A")).toBe(true);
    expect(isValidHandle("a".repeat(15))).toBe(true);
  });

  it("rejects invalid handles", () => {
    expect(isValidHandle("")).toBe(false);
    expect(isValidHandle("a".repeat(16))).toBe(false);
    expect(isValidHandle("user name")).toBe(false);
    expect(isValidHandle("user.name")).toBe(false);
    expect(isValidHandle("@user")).toBe(false);
    expect(isValidHandle("user/evil")).toBe(false);
    expect(isValidHandle("../../etc")).toBe(false);
  });
});

describe("sanitizeHandle", () => {
  it("strips @ and validates", () => {
    expect(sanitizeHandle("@elonmusk")).toBe("elonmusk");
    expect(sanitizeHandle("elonmusk")).toBe("elonmusk");
  });

  it("returns null for invalid handles", () => {
    expect(sanitizeHandle("")).toBeNull();
    expect(sanitizeHandle("@")).toBeNull();
    expect(sanitizeHandle("@../../bad")).toBeNull();
  });
});
