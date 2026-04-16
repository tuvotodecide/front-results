import type { PadronImportError } from "../../../store/votingEvents";
import { getRuntimeEnv } from "../../../shared/system/runtimeEnv";
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

type GeminiUploadFileResponse = {
  file?: {
    name?: string;
    uri?: string;
    mimeType?: string;
    mime_type?: string;
    state?: string;
  };
  name?: string;
  uri?: string;
  mimeType?: string;
  mime_type?: string;
  state?: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

type GeminiRawResponse = {
  records?: unknown;
  observations?: unknown;
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
const PADRON_DRAFT_STORAGE_PREFIX = "padronGeminiDraft";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const ENABLED_TRUE_VALUES = new Set(["1", "true", "si", "sí", "habilitado", "activo"]);
const ENABLED_FALSE_VALUES = new Set(["0", "false", "no", "inhabilitado", "deshabilitado", "inactivo"]);

// Prompt mantenible y orientado a salida JSON estricta. La UI valida el JSON y
// convierte cualquier fila ambigua en observación en lugar de asumir datos.
export const PADRON_GEMINI_PROMPT = `
Analiza el documento adjunto del padrón electoral. El documento puede ser PDF o imagen.

Tu tarea es extraer SOLO una estructura JSON con esta forma exacta:
{
  "records": [
    { "carnet": "12345678", "habilitado": true }
  ],
  "observations": [
    { "message": "texto", "rowIndex": 3, "rawValue": "valor original" }
  ]
}

Reglas obligatorias:
1. Responde solo JSON válido. No agregues markdown, comentarios ni texto extra.
2. "records" debe contener solo filas entendibles con carnet y habilitación claros.
3. "observations" debe contener filas dudosas, incompletas, duplicadas, ruido, encabezados confusos o datos que no puedas interpretar con seguridad.
4. Interpreta la columna de habilitación así:
   - si, sí, habilitado, true, activo => true
   - no, inhabilitado, deshabilitado, false, inactivo => false
5. Ignora encabezados, numeración decorativa, títulos y texto que no sea una fila real del padrón.
6. Si el documento está en formato tabla o columnas, respeta el orden lógico de lectura.
7. No inventes carnets ni estados.
8. Si no estás seguro de una fila, envíala a "observations" en vez de asumir.
9. Mantén el carnet en formato legible; no agregues caracteres que no estén en el documento.
10. Si el documento no contiene filas útiles, devuelve "records": [] y explica el motivo en "observations".
`.trim();

const buildDraftStorageKey = (eventId: string) =>
  `${PADRON_DRAFT_STORAGE_PREFIX}:${eventId}`;

const getGeminiApiKey = () =>
  getRuntimeEnv("VITE_GEMINI_API_KEY", "NEXT_PUBLIC_GEMINI_API_KEY");

export const hasGeminiPadronConfig = () => Boolean(getGeminiApiKey()?.trim());

export const getGeminiPadronModel = () =>
  getRuntimeEnv("VITE_GEMINI_PADRON_MODEL", "NEXT_PUBLIC_GEMINI_PADRON_MODEL") ||
  DEFAULT_GEMINI_MODEL;

const getMimeType = (file: File) => {
  if (file.type) return file.type;

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

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

const buildCarnetKey = (value: string) =>
  normalizePadronCarnet(value).replace(/[\s.-]/g, "");

const parseEnabledValue = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  if (ENABLED_TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (ENABLED_FALSE_VALUES.has(normalized)) {
    return false;
  }

  return null;
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

const extractJsonText = (response: GeminiGenerateContentResponse) => {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text) {
    return text;
  }

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`La IA bloqueó la solicitud (${blockReason}).`);
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason) {
    throw new Error(`La IA no devolvió contenido utilizable (${finishReason}).`);
  }

  throw new Error("La IA no devolvió un resultado de texto para el padrón.");
};

const parseGeminiJson = (rawText: string): GeminiRawResponse => {
  try {
    return JSON.parse(rawText) as GeminiRawResponse;
  } catch {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1)) as GeminiRawResponse;
    }
    throw new Error("La IA devolvió una respuesta que no es JSON válido.");
  }
};

const normalizeGeminiResult = (
  parsed: GeminiRawResponse,
): Pick<GeminiPadronDraft, "records" | "observations"> => {
  const rawRecords = Array.isArray(parsed.records) ? parsed.records : [];
  const rawObservations = Array.isArray(parsed.observations) ? parsed.observations : [];
  const observations: PadronImportError[] = [];
  const records: GeminiPadronDraftRecord[] = [];
  const seenCarnets = new Set<string>();

  rawObservations.forEach((entry, index) => {
    const normalized = parseObservation(entry, index + 1);
    if (normalized) {
      observations.push(normalized);
    }
  });

  rawRecords.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      observations.push({
        code: "INVALID_RECORD",
        message: "La IA devolvió una fila sin estructura válida.",
        rowIndex: index + 1,
        rawValue: String(entry ?? ""),
      });
      return;
    }

    const raw = entry as Record<string, unknown>;
    const carnet = normalizePadronCarnet(String(raw.carnet ?? raw.ci ?? raw.carnetIdentidad ?? ""));
    if (!carnet) {
      observations.push({
        code: "INVALID_CARNET",
        message: "La IA devolvió una fila sin carnet legible.",
        rowIndex: index + 1,
        rawValue: JSON.stringify(raw),
      });
      return;
    }

    const enabled = parseEnabledValue(raw.habilitado ?? raw.enabled ?? raw.estado);
    if (enabled === null) {
      observations.push({
        code: "INVALID_ENABLED_VALUE",
        message: "No se pudo interpretar la columna de habilitación.",
        rowIndex: index + 1,
        rawValue: JSON.stringify(raw),
      });
      return;
    }

    const carnetKey = buildCarnetKey(carnet);
    if (!carnetKey) {
      observations.push({
        code: "INVALID_CARNET",
        message: "El carnet quedó vacío después de normalizarlo.",
        rowIndex: index + 1,
        rawValue: JSON.stringify(raw),
      });
      return;
    }

    if (seenCarnets.has(carnetKey)) {
      observations.push({
        code: "DUPLICATE_CARNET",
        message: "La IA devolvió un carnet duplicado.",
        rowIndex: index + 1,
        rawValue: carnet,
      });
      return;
    }

    seenCarnets.add(carnetKey);
    records.push({
      id: createDraftRecordId(),
      carnet,
      enabled,
      sourceKind: "PARSED",
      sourceRow: index + 1,
      updatedAt: null,
    });
  });

  if (!records.length && !observations.length) {
    observations.push({
      code: "EMPTY_RESULT",
      message: "La IA no pudo extraer registros ni observaciones del documento.",
      rowIndex: null,
      rawValue: null,
    });
  }

  return { records, observations };
};

const uploadFileToGemini = async (
  file: File,
  apiKey: string,
): Promise<Required<GeminiUploadFileResponse>["file"]> => {
  const mimeType = getMimeType(file);
  const startResponse = await fetch(`${GEMINI_BASE_URL}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(file.size),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: {
        display_name: file.name,
      },
    }),
  });

  if (!startResponse.ok) {
    const message = await startResponse.text();
    throw new Error(`No se pudo iniciar la carga del archivo en la IA. ${message}`);
  }

  const uploadUrl = startResponse.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("La IA no devolvió una URL de carga para el archivo.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(file.size),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: await file.arrayBuffer(),
  });

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(`La IA no pudo recibir el archivo. ${message}`);
  }

  const uploadData = (await uploadResponse.json()) as GeminiUploadFileResponse;
  const uploadedFile = uploadData.file ?? uploadData;
  if (!uploadedFile?.uri || !uploadedFile?.name) {
    throw new Error("La IA no devolvió la referencia del archivo cargado.");
  }

  if (uploadedFile.state === "PROCESSING") {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await wait(1200);

      const statusResponse = await fetch(
        `${GEMINI_BASE_URL}/v1beta/${uploadedFile.name}`,
        {
          headers: {
            "x-goog-api-key": apiKey,
          },
        },
      );

      if (!statusResponse.ok) {
        const message = await statusResponse.text();
        throw new Error(`No se pudo consultar el estado del archivo en la IA. ${message}`);
      }

      const statusData = (await statusResponse.json()) as GeminiUploadFileResponse;
      const statusFile = statusData.file ?? statusData;
      if (statusFile?.state === "ACTIVE" && statusFile.uri) {
        return statusFile as Required<GeminiUploadFileResponse>["file"];
      }

      if (statusFile?.state && statusFile.state !== "PROCESSING") {
        throw new Error(`La IA dejó el archivo en estado ${statusFile.state}.`);
      }
    }

    throw new Error("La IA tardó demasiado en preparar el archivo para analizarlo.");
  }

  return uploadedFile as Required<GeminiUploadFileResponse>["file"];
};

const requestGeminiPadronJson = async (
  uploadedFile: Required<GeminiUploadFileResponse>["file"],
  apiKey: string,
  model: string,
) => {
  const response = await fetch(
    `${GEMINI_BASE_URL}/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "Responde solo con JSON válido y no inventes datos del padrón." }],
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: PADRON_GEMINI_PROMPT },
              {
                file_data: {
                  mime_type:
                    uploadedFile.mimeType ??
                    uploadedFile.mime_type ??
                    "application/octet-stream",
                  file_uri: uploadedFile.uri,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              records: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    carnet: { type: "STRING" },
                    habilitado: { type: "BOOLEAN" },
                  },
                  required: ["carnet", "habilitado"],
                },
              },
              observations: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    message: { type: "STRING" },
                    rowIndex: { type: "NUMBER" },
                    rawValue: { type: "STRING" },
                  },
                  required: ["message"],
                },
              },
            },
            required: ["records", "observations"],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`La IA no pudo analizar el padrón. ${message}`);
  }

  return (await response.json()) as GeminiGenerateContentResponse;
};

export const analyzePadronDocumentWithGemini = async (
  file: File,
): Promise<GeminiPadronDraft> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const model = getGeminiPadronModel();
  const uploadedFile = await uploadFileToGemini(file, apiKey);
  const response = await requestGeminiPadronJson(uploadedFile, apiKey, model);
  const rawText = extractJsonText(response);
  const parsed = parseGeminiJson(rawText);
  const normalized = normalizeGeminiResult(parsed);

  return {
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    sourceType: getMimeType(file) === "application/pdf" ? "PDF_GEMINI" : "IMAGE_GEMINI",
    analysisProvider: "GEMINI_CLIENT",
    model,
    records: normalized.records,
    observations: normalized.observations,
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

  return {
    totalCount: draft.records.length,
    enabledCount,
    disabledCount,
    observedCount: draft.observations.length,
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
