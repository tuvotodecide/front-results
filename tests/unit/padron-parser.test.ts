import type { Voter } from "@/features/electionConfig/types";
import {
  buildUploadCsv,
  parseEnabledCell,
  parsePadronCsv,
  revalidateRows,
} from "@/features/electionConfig/data/padronCsvParser";

const makeFile = (content: string, name = "padron.csv") => {
  const file = new File([content], name, { type: "text/csv" }) as File & {
    text: () => Promise<string>;
  };

  file.text = () => Promise.resolve(content);

  return file;
};

describe("MX-05 | Padrón, staging, elegibilidad y archivos | Frontend", () => {
  it("PAD-CSV-P1-001 | interpreta valores de habilitación legacy de forma consistente", () => {
    expect(parseEnabledCell("sí")).toEqual({ valid: true, enabled: true });
    expect(parseEnabledCell("no")).toEqual({ valid: true, enabled: false });
    expect(parseEnabledCell("tal vez")).toEqual({ valid: false, enabled: false });
  });

  it("PAD-CSV-P1-001 | rechaza CSV vacío o con encabezados incompatibles", async () => {
    await expect(parsePadronCsv(makeFile(""))).rejects.toThrow("El CSV está vacío");
    await expect(
      parsePadronCsv(makeFile("nombre,habilitado\nJuan,si")),
    ).rejects.toThrow('El CSV debe tener la primera columna "dni" o "carnet"');
  });

  it("PAD-DUP-P0-001 / PAD-NRM-P0-001 | marca duplicados, carnets inválidos y celdas inválidas", async () => {
    const result = await parsePadronCsv(
      makeFile(
        [
          "dni,habilitado",
          "1234567,si",
          "1234567,no",
          "12-A,si",
          "7654321,quizas",
        ].join("\n"),
      ),
    );

    expect(result.totalRecords).toBe(4);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(3);
    expect(result.voters.map((row: Voter) => row.invalidReason)).toEqual([
      undefined,
      "duplicate",
      "invalid_format",
      "invalid_enabled",
    ]);
  });

  it("PAD-NRM-P0-001 | normaliza mayúsculas y espacios sin aceptar puntos ni guiones", async () => {
    const result = await parsePadronCsv(
      makeFile(
        [
          "carnet,habilitado",
          " abc123 ,si",
          "ABC 123,no",
          "123.456,si",
          "123-456,si",
          "ABCDE,si",
        ].join("\n"),
      ),
    );

    expect(result.voters.map((row: Voter) => row.carnet)).toEqual([
      "ABC123",
      "ABC 123",
      "123.456",
      "123-456",
      "ABCDE",
    ]);
    expect(result.voters.map((row: Voter) => row.invalidReason)).toEqual([
      undefined,
      "duplicate",
      "invalid_format",
      "invalid_format",
      undefined,
    ]);
  });

  it("PAD-DUP-P0-002 | revalida filas corregidas y exporta CSV normalizado", () => {
    const rows: Voter[] = [
      {
        id: "1",
        rowNumber: 1,
        carnet: "1234567",
        fullName: "",
        hasIdentity: true,
        enabled: true,
        status: "valid",
      },
      {
        id: "2",
        rowNumber: 2,
        carnet: "1234567",
        fullName: "",
        hasIdentity: true,
        enabled: false,
        status: "invalid",
        invalidReason: "duplicate",
      },
    ];

    const corrected = revalidateRows([
      rows[0]!,
      { ...rows[1]!, carnet: "7654321", invalidReason: undefined },
    ]);

    expect(corrected.every((row: Voter) => row.status === "valid")).toBe(true);
    expect(buildUploadCsv(corrected)).toBe(
      ["carnet,habilitado", "1234567,si", "7654321,no"].join("\n"),
    );
  });
});
