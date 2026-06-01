import { describe, it, expect } from "vitest";

describe("project smoke test", () => {
  it("passes", () => {
    expect(true).toBe(true);
  });

  it("basic arithmetic works", () => {
    expect(1 + 1).toBe(2);
  });
});
