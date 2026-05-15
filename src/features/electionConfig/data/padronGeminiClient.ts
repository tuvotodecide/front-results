import type { PadronImportError } from "../../../store/votingEvents";
import { readStorage, removeStorage, writeStorage } from "../../../shared/system/browserStorage";

export type GeminiDraftSourceType = "PDF_GEMINI" | "IMAGE_GEMINI" | "MANUAL_CLIENT";

export interface GeminiPadronDraftRecord {
  id: string;
  carnet: string;
  enabled: boolean;
  sourceKind: "PARSED" | "MANUAL";
  sourceRow: number | null;
  updatedAt: string | null;
}

export interface GeminiPadronDraft {
  fileName: string;
  uploadedAt: string;
  sourceType: GeminiDraftSourceType;
  analysisProvider: "GEMINI_CLIENT" | "MANUAL_CLIENT";
  model: string | null;
  records: GeminiPadronDraftRecord[];
  observations: PadronImportError[];
}

const PADRON_DRAFT_STORAGE_PREFIX = "padronGeminiDraft";

const buildDraftStorageKey = (eventId: string) =>
  `${PADRON_DRAFT_STORAGE_PREFIX}:${eventId}`;

const createDraftRecordId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `padron-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const normalizePadronCarnet = (value: string) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^0-9A-Z\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isInformationalGeminiObservation = (observation: PadronImportError) => {
  const code = String(observation.code ?? "").trim().toUpperCase();
  const message = String(observation.message ?? "").trim().toLowerCase();

  if (code !== "GEMINI_OBSERVATION") {
    return false;
  }

  const normalizedRawValue = String(observation.rawValue ?? "").trim();
  const hasSpecificRowReference =
    observation.rowIndex !== null &&
    observation.rowIndex !== undefined &&
    Number.isFinite(Number(observation.rowIndex));

  if (
    message.includes("encabezado") ||
    message.includes("omitid") ||
    message.includes("ruido") ||
    message.includes("ignorado")
  ) {
    return true;
  }

  return !normalizedRawValue && !hasSpecificRowReference;
};

export const isBlockingGeminiObservation = (observation: PadronImportError) => {
  const code = String(observation.code ?? "").trim().toUpperCase();
  const message = String(observation.message ?? "").trim().toLowerCase();

  if (code !== "GEMINI_OBSERVATION") {
    return true;
  }

  if (isInformationalGeminiObservation(observation)) {
    return false;
  }

  return (
    message.includes("error") ||
    message.includes("inválid") ||
    message.includes("invalid") ||
    message.includes("ambigu") ||
    message.includes("incomplet") ||
    message.includes("falt") ||
    message.includes("no se pudo") ||
    message.includes("no fue posible") ||
    message.includes("correg") ||
    message.includes("revis")
  );
};

const parseObservation = (value: unknown, fallbackIndex: number): PadronImportError | null => {
  if (typeof value === "string" && value.trim()) {
    return {
      code: "GEMINI_OBSERVATION",
      message: value.trim(),
      rowIndex: fallbackIndex,
      rawValue: null,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const message = String(raw.message ?? raw.reason ?? raw.error ?? "").trim();
  if (!message) {
    return null;
  }

  return {
    code: String(raw.code ?? "GEMINI_OBSERVATION"),
    message,
    rowIndex:
      raw.rowIndex === null || raw.rowIndex === undefined || Number.isNaN(Number(raw.rowIndex))
        ? fallbackIndex
        : Number(raw.rowIndex),
    rawValue:
      raw.rawValue === null || raw.rawValue === undefined
        ? null
        : String(raw.rawValue),
  };
};

export const createManualPadronDraft = (fileName = "Padron manual"): GeminiPadronDraft => ({
  fileName,
  uploadedAt: new Date().toISOString(),
  sourceType: "MANUAL_CLIENT",
  analysisProvider: "MANUAL_CLIENT",
  model: null,
  records: [],
  observations: [],
});

export const updateGeminiDraftRecord = (
  draft: GeminiPadronDraft,
  recordId: string,
  payload: { ci?: string; enabled?: boolean },
) => ({
  ...draft,
  records: draft.records.map((record) =>
    record.id === recordId
      ? {
          ...record,
          carnet: payload.ci !== undefined ? normalizePadronCarnet(payload.ci) : record.carnet,
          enabled: payload.enabled ?? record.enabled,
          updatedAt: new Date().toISOString(),
        }
      : record,
  ),
});

export const addGeminiDraftRecord = (
  draft: GeminiPadronDraft,
  payload: { ci: string; enabled: boolean },
) => ({
  ...draft,
  records: [
    {
      id: createDraftRecordId(),
      carnet: normalizePadronCarnet(payload.ci),
      enabled: payload.enabled,
      sourceKind: "MANUAL" as const,
      sourceRow: null,
      updatedAt: new Date().toISOString(),
    },
    ...draft.records,
  ],
});

export const deleteGeminiDraftRecord = (draft: GeminiPadronDraft, recordId: string) => ({
  ...draft,
  records: draft.records.filter((record) => record.id !== recordId),
});

export const toggleGeminiDraftRecord = (
  draft: GeminiPadronDraft,
  recordId: string,
  nextEnabled: boolean,
) => ({
  ...draft,
  records: draft.records.map((record) =>
    record.id === recordId
      ? {
          ...record,
          enabled: nextEnabled,
          updatedAt: new Date().toISOString(),
        }
      : record,
  ),
});

export const getGeminiDraftSummary = (draft: GeminiPadronDraft) => {
  const enabledCount = draft.records.filter((record) => record.enabled).length;
  const disabledCount = draft.records.length - enabledCount;
  const blockingObservationsCount = draft.observations.filter(isBlockingGeminiObservation).length;

  return {
    totalCount: draft.records.length,
    enabledCount,
    disabledCount,
    observedCount: blockingObservationsCount,
  };
};

export const buildPadronCsvFromDraft = (draft: GeminiPadronDraft) =>
  [
    "carnet,habilitado",
    ...draft.records.map((record) => `${record.carnet},${record.enabled ? "si" : "no"}`),
  ].join("\n");

export const saveGeminiPadronDraft = (eventId: string, draft: GeminiPadronDraft) => {
  writeStorage(buildDraftStorageKey(eventId), JSON.stringify(draft));
};

export const clearGeminiPadronDraft = (eventId: string) => {
  removeStorage(buildDraftStorageKey(eventId));
};

export const loadGeminiPadronDraft = (eventId: string): GeminiPadronDraft | null => {
  const rawValue = readStorage(buildDraftStorageKey(eventId));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<GeminiPadronDraft>;
    if (!Array.isArray(parsed.records) || !Array.isArray(parsed.observations)) {
      return null;
    }

    return {
      fileName: String(parsed.fileName ?? "Padron recuperado"),
      uploadedAt: String(parsed.uploadedAt ?? new Date().toISOString()),
      sourceType:
        parsed.sourceType === "PDF_GEMINI" ||
        parsed.sourceType === "IMAGE_GEMINI" ||
        parsed.sourceType === "MANUAL_CLIENT"
          ? parsed.sourceType
          : "MANUAL_CLIENT",
      analysisProvider:
        parsed.analysisProvider === "GEMINI_CLIENT"
          ? "GEMINI_CLIENT"
          : "MANUAL_CLIENT",
      model: parsed.model ? String(parsed.model) : null,
      records: parsed.records
        .map((record) => {
          if (!record || typeof record !== "object") {
            return null;
          }

          const raw = record as unknown as Record<string, unknown>;
          const carnet = normalizePadronCarnet(String(raw.carnet ?? ""));
          if (!carnet) {
            return null;
          }

          return {
            id: String(raw.id ?? createDraftRecordId()),
            carnet,
            enabled: raw.enabled !== false,
            sourceKind: raw.sourceKind === "MANUAL" ? "MANUAL" : "PARSED",
            sourceRow:
              raw.sourceRow === null || raw.sourceRow === undefined
                ? null
                : Number(raw.sourceRow),
            updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
          };
        })
        .filter((record): record is GeminiPadronDraftRecord => Boolean(record)),
      observations: parsed.observations
        .map((observation, index) => parseObservation(observation, index + 1))
        .filter((observation): observation is PadronImportError => Boolean(observation)),
    };
  } catch {
    clearGeminiPadronDraft(eventId);
    return null;
  }
};
