import { describe, expect, it } from "vitest";

describe("pipeline failure proof", () => {
  it("fails intentionally to verify CI quality gate", () => {
    expect(true).toBe(false);
  });
});
