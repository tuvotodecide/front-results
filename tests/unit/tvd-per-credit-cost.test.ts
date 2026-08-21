import { describe, expect, it } from "vitest";
import {
  formatRequiredTvd,
  formatSmallestUnitAsTvd,
  getRequiredSmallestUnit,
  type TvdPerCreditValue,
} from "@/features/adminTvd/data/useTvdPerCredit";

const rate = (whole: string): TvdPerCreditValue => ({
  raw: whole,
  decimals: 18,
  formatted: "n/a",
});

const ONE_TVD = `1${"0".repeat(18)}`;
const HALF_TVD = `5${"0".repeat(17)}`;

describe("costo por participante derivado de tvdPerCredit", () => {
  it("multiplica participantes por la tasa en la unidad más pequeña", () => {
    expect(getRequiredSmallestUnit(250, rate(ONE_TVD))).toBe(
      BigInt(`250${"0".repeat(18)}`),
    );
  });

  it("no pierde precisión con tasas fraccionarias", () => {
    expect(getRequiredSmallestUnit(3, rate(HALF_TVD))).toBe(
      BigInt(`15${"0".repeat(17)}`),
    );
    expect(formatRequiredTvd(3, rate(HALF_TVD))).toBe("1.5 TVD");
  });

  it("soporta límites grandes sin desbordar el número seguro de JS", () => {
    const participants = "10000000000";
    expect(formatRequiredTvd(participants, rate(ONE_TVD))).toBe(
      "10000000000 TVD",
    );
  });

  it("descarta entradas que no son enteros positivos", () => {
    expect(getRequiredSmallestUnit("12.5", rate(ONE_TVD))).toBeNull();
    expect(getRequiredSmallestUnit("-3", rate(ONE_TVD))).toBeNull();
    expect(getRequiredSmallestUnit("abc", rate(ONE_TVD))).toBeNull();
    expect(getRequiredSmallestUnit(250, null)).toBeNull();
  });

  it("formatea montos crudos recortando decimales sobrantes", () => {
    expect(formatSmallestUnitAsTvd(`250${"0".repeat(18)}`, 18)).toBe("250 TVD");
    expect(formatSmallestUnitAsTvd("0", 18)).toBe("0 TVD");
    expect(formatSmallestUnitAsTvd("no-numerico", 18)).toBeNull();
    expect(formatSmallestUnitAsTvd(null, 18)).toBeNull();
  });
});
