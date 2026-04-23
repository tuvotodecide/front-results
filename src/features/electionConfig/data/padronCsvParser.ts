import type { InvalidReason, PadronUploadResult, Voter } from "../types";

const TRUE_VALUES = new Set(["1", "true", "si", "sí", "habilitado", "activo"]);
const FALSE_VALUES = new Set(["0", "false", "no", "inhabilitado", "deshabilitado", "inactivo"]);

export const parseCsvRow = (line: string) => {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export const parseEnabledCell = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return { valid: true, enabled: true };
  }

  if (FALSE_VALUES.has(normalized)) {
    return { valid: true, enabled: false };
  }

  return { valid: false, enabled: false };
};

const normalizeCarnet = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const getCarnetKey = (value: string) => value.replace(/\s+/g, "");

const getCarnetInvalidReason = (carnet: string): InvalidReason | null => {
  if (!carnet) return "empty";
  return /^[0-9A-Z]+$/.test(getCarnetKey(carnet)) ? null : "invalid_format";
};

export const revalidateRows = (rows: Voter[]): Voter[] => {
  const seen = new Set<string>();

  return rows.map((row, index) => {
    const carnet = normalizeCarnet(row.carnet);
    const carnetKey = getCarnetKey(carnet);
    const invalidReason = getCarnetInvalidReason(carnet);
    const duplicate = Boolean(carnetKey && seen.has(carnetKey));

    if (carnetKey && !invalidReason && !duplicate) {
      seen.add(carnetKey);
    }

    const nextInvalidReason = invalidReason ?? (duplicate ? "duplicate" : undefined);

    return {
      ...row,
      rowNumber: index + 1,
      carnet,
      status: nextInvalidReason ? "invalid" : "valid",
      invalidReason: nextInvalidReason,
    };
  });
};

export const parsePadronCsv = async (file: File): Promise<PadronUploadResult> => {
  const content = (await file.text()).replace(/^\uFEFF/, "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("El CSV está vacío");
  }

  const header = parseCsvRow(lines[0] ?? "");
  const firstHeader = String(header[0] ?? "").trim().toLowerCase();
  const secondHeader = String(header[1] ?? "").trim().toLowerCase();

  if (firstHeader !== "dni" && firstHeader !== "carnet") {
    throw new Error('El CSV debe tener la primera columna "dni" o "carnet"');
  }

  if (secondHeader !== "habilitado") {
    throw new Error('El CSV debe tener la segunda columna "habilitado"');
  }

  const parsedRows: Voter[] = lines.slice(1).map((line, index) => {
    const values = parseCsvRow(line);
    const carnet = normalizeCarnet(values[0]);
    const enabledCell = parseEnabledCell(values[1]);
    const invalidReason = enabledCell.valid ? getCarnetInvalidReason(carnet) : "invalid_enabled";

    return {
      id: `row-${index + 1}`,
      rowNumber: index + 1,
      carnet,
      fullName: "",
      enabled: enabledCell.enabled,
      hasIdentity: true,
      status: invalidReason ? "invalid" : "valid",
      invalidReason: invalidReason ?? undefined,
    };
  });

  const rows = revalidateRows(parsedRows).map((row, index) => {
    const originalInvalidReason = parsedRows[index]?.invalidReason;
    if (originalInvalidReason === "invalid_enabled") {
      return {
        ...row,
        status: "invalid" as const,
        invalidReason: originalInvalidReason,
      };
    }
    return row;
  });
  const validCount = rows.filter((row) => row.status === "valid").length;
  const invalidCount = rows.length - validCount;
  const enabledCount = rows.filter((row) => row.enabled).length;

  return {
    totalRecords: rows.length,
    validCount,
    invalidCount,
    duplicateCount: rows.filter((row) => row.invalidReason === "duplicate").length,
    enabledCount,
    disabledCount: rows.length - enabledCount,
    voters: rows,
  };
};

export const buildUploadCsv = (rows: Voter[]) =>
  [
    "carnet,habilitado",
    ...rows
      .filter((row) => row.status === "valid")
      .map((row) => `${normalizeCarnet(row.carnet)},${row.enabled ? "si" : "no"}`),
  ].join("\n");
