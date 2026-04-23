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

describe("padron csv parser", () => {
  it("parses enabled values consistently", () => {
    expect(parseEnabledCell("sí")).toEqual({ valid: true, enabled: true });
    expect(parseEnabledCell("no")).toEqual({ valid: true, enabled: false });
    expect(parseEnabledCell("tal vez")).toEqual({ valid: false, enabled: false });
  });

  it("rejects empty and malformed csv files", async () => {
    await expect(parsePadronCsv(makeFile(""))).rejects.toThrow("El CSV está vacío");
    await expect(
      parsePadronCsv(makeFile("nombre,habilitado\nJuan,si")),
    ).rejects.toThrow('El CSV debe tener la primera columna "dni" o "carnet"');
  });

  it("marks duplicates, invalid ids and invalid enabled cells", async () => {
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

  it("revalidates rows after local corrections and exports normalized csv", () => {
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
