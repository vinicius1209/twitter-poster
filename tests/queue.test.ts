import { describe, it, expect } from "vitest";
import { enqueue } from "../src/browser/queue.js";

describe("browser queue", () => {
  it("executes tasks sequentially", async () => {
    const order: number[] = [];

    const p1 = enqueue(async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
      return "a";
    });

    const p2 = enqueue(async () => {
      order.push(2);
      return "b";
    });

    const p3 = enqueue(async () => {
      order.push(3);
      return "c";
    });

    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual(["a", "b", "c"]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("propagates errors without blocking the queue", async () => {
    const p1 = enqueue(async () => {
      throw new Error("boom");
    });

    const p2 = enqueue(async () => "ok");

    await expect(p1).rejects.toThrow("boom");
    expect(await p2).toBe("ok");
  });
});
