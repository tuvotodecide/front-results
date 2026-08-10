import { describe, expect, it } from "vitest";
import { formatTvdToBob } from "@/features/electionConfig/data/useElectionTvdUsage";

describe("formatTvdToBob", () => {
  it("convierte TVD con bobPerToken vigente sin usar Number", () => {
    expect(formatTvdToBob("2000000000000000000", 18, "6.90")).toBe("13.80 Bs");
    expect(formatTvdToBob("900000000000000000", 18, "6.90")).toBe("6.21 Bs");
  });

  it("no inventa un equivalente cuando la tasa no está disponible", () => {
    expect(formatTvdToBob("2000000000000000000", 18, null)).toBeNull();
  });
});
