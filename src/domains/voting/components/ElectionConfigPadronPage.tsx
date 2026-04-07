"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Modal2 from "@/components/Modal2";
import ConfigPageFallback from "@/features/electionConfig/components/ConfigPageFallback";
import ConfigStepsTabs from "@/features/electionConfig/components/ConfigStepsTabs";
import FixInvalidModal from "@/features/electionConfig/components/FixInvalidModal";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";
import PadronDropzone from "@/features/electionConfig/components/PadronDropzone";
import UploadProgressModal from "@/features/electionConfig/components/UploadProgressModal";
import UploadSummaryModal from "@/features/electionConfig/components/UploadSummaryModal";
import type {
  ConfigStep,
  CorrectionInput,
  InvalidReason,
  PadronFile,
  PadronUploadResult,
  Voter,
} from "@/features/electionConfig/types";
import {
  buildElectionConfigPath,
  hasDraftAlreadyStarted,
} from "@/domains/voting/lib/electionConfig";
import { setSelectedElection } from "@/store/election/electionSlice";
import {
  useGetEventOptionsQuery,
  useGetEventRolesQuery,
  useGetPadronVersionsQuery,
  useGetPadronVotersQuery,
  useGetVotingEventQuery,
  useImportPadronMutation,
  useLazyDownloadPadronCsvQuery,
} from "@/store/votingEvents";

type ModalState = "none" | "uploading" | "summary" | "fixing" | "revalidating" | "deleteConfirm";

const HEADER_DNI = "dni";
const HEADER_CARNET = "carnet";
const HEADER_ENABLED = "habilitado";
const BOLIVIAN_CARNET_REGEX = /^\d{5,10}[A-Z]{0,2}$/;

const normalizeCell = (value: string) => value.replace(/^"|"$/g, "").trim();
const normalizeCarnet = (value: string) =>
  normalizeCell(value)
    .toUpperCase()
    .replace(/[\s.-]/g, "");
const isValidCarnet = (value: string) => BOLIVIAN_CARNET_REGEX.test(normalizeCarnet(value));

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { data?: { message?: string }; message?: string };
    return candidate.data?.message ?? candidate.message ?? fallback;
  }

  return fallback;
};

const parseEnabledCell = (value: string): { valid: boolean; enabled: boolean } => {
  const normalized = normalizeCell(value).toLowerCase();
  if (!normalized) return { valid: true, enabled: true };
  if (["1", "true", "si", "sí", "habilitado", "activo"].includes(normalized)) {
    return { valid: true, enabled: true };
  }
  if (["0", "false", "no", "deshabilitado", "inactivo"].includes(normalized)) {
    return { valid: true, enabled: false };
  }
  return { valid: false, enabled: false };
};

const revalidateRows = (rows: Voter[]): Voter[] => {
  const seen = new Set<string>();
  return rows.map((row) => {
    const cleaned = normalizeCarnet(row.carnet);
    if (!cleaned) {
      return { ...row, carnet: cleaned, status: "invalid", invalidReason: "empty" };
    }
    if (!isValidCarnet(cleaned)) {
      return { ...row, carnet: cleaned, status: "invalid", invalidReason: "invalid_format" };
    }
    if (row.invalidReason === "invalid_enabled") {
      return { ...row, carnet: cleaned, status: "invalid", invalidReason: "invalid_enabled" };
    }
    if (seen.has(cleaned)) {
      return { ...row, carnet: cleaned, status: "invalid", invalidReason: "duplicate" };
    }
    seen.add(cleaned);
    return { ...row, carnet: cleaned, status: "valid", invalidReason: undefined };
  });
};

const parsePadronCsv = async (file: File) => {
  const text = await file.text();
  const lines = text
    .replace(/\uFEFF/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("El CSV está vacío");
  }

  const headerColumns = lines[0].split(",").map((cell) => normalizeCell(cell).toLowerCase());
  const mainHeader = headerColumns[0];
  const enabledHeader = headerColumns[1];
  if (mainHeader !== HEADER_DNI && mainHeader !== HEADER_CARNET) {
    throw new Error('El CSV debe tener la primera columna "dni" o "carnet"');
  }
  if (enabledHeader && enabledHeader !== HEADER_ENABLED) {
    throw new Error('La segunda columna debe llamarse "habilitado"');
  }

  const rows: Voter[] = lines.slice(1).map((line, idx) => {
    const [rawCarnet = "", rawEnabled = ""] = line.split(",");
    const cell = normalizeCarnet(rawCarnet);
    const enabled = parseEnabledCell(rawEnabled);
    return {
      id: `row-${idx + 1}`,
      rowNumber: idx + 1,
      carnet: cell,
      fullName: "",
      enabled: enabled.enabled,
      status: "valid",
      invalidReason: enabled.valid ? undefined : "invalid_enabled",
    };
  });

  const validated = revalidateRows(rows);
  const invalidCount = validated.filter((v) => v.status === "invalid").length;
  const validCount = validated.length - invalidCount;

  return {
    rows: validated,
    totalRecords: validated.length,
    validCount,
    invalidCount,
  };
};

const buildUploadCsv = (rows: Voter[]) => {
  const lines = [
    `${HEADER_CARNET},${HEADER_ENABLED}`,
    ...rows.map((row) => `${row.carnet.trim()},${row.enabled ? "si" : "no"}`),
  ];
  return lines.join("\n");
};

export default function ElectionConfigPadronPage({
  electionId,
}: Readonly<{ electionId: string }>) {
  const router = useRouter();
  const dispatch = useDispatch();
  const actualElectionId = electionId || "";
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: event,
    isLoading: loadingEvent,
    isError: eventLoadFailed,
    refetch: refetchEvent,
  } = useGetVotingEventQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: roles = [], isError: rolesLoadFailed } = useGetEventRolesQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: options = [], isError: optionsLoadFailed } = useGetEventOptionsQuery(
    actualElectionId,
    {
      skip: !actualElectionId,
    },
  );
  const {
    data: padronVersions = [],
    isLoading: loadingVersions,
    isError: padronVersionsLoadFailed,
  } = useGetPadronVersionsQuery(actualElectionId, {
    skip: !actualElectionId,
  });

  const [page, setPage] = useState(1);
  const [searchTerm, setSearch] = useState("");
  const pageSize = 50;

  const { data: votersData, isLoading: loadingVoters, isError: votersLoadFailed } =
    useGetPadronVotersQuery(
      { eventId: actualElectionId, page, limit: pageSize },
      { skip: !actualElectionId || padronVersions.length === 0 },
    );

  const [importPadron, { isLoading: importing }] = useImportPadronMutation();
  const [downloadPadronCsv, { isFetching: downloadingCsv }] = useLazyDownloadPadronCsvQuery();

  const hasPositions = roles.length > 0;
  const hasPartiesWithCandidates = options.some((opt) => opt.candidates.length > 0);
  const latestVersion = padronVersions.length > 0 ? padronVersions[0] : null;
  const isLoaded = !!latestVersion;
  const loading = loadingVersions || loadingVoters;

  const validCount = latestVersion?.validCount || 0;
  const invalidCount = latestVersion?.invalidCount || 0;
  const totalVoters = latestVersion?.totalRecords || 0;
  const isPadronReady = isLoaded && validCount > 0 && invalidCount === 0;

  const voters: Voter[] = (votersData?.voters || []).map((v, idx) => ({
    id: v.id,
    rowNumber: (page - 1) * pageSize + idx + 1,
    carnet: v.carnet,
    fullName: v.fullName || "",
    enabled: v.enabled !== false,
    status: v.status,
    invalidReason: v.invalidReason as InvalidReason | undefined,
  }));

  const filteredVoters = searchTerm
    ? voters.filter(
        (voter) =>
          voter.carnet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voter.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : voters;

  const totalPages = Math.ceil((votersData?.total || 0) / pageSize);

  const file: PadronFile | null = latestVersion
    ? {
        fileName: latestVersion.fileName,
        uploadedAt: latestVersion.uploadedAt,
        totalRecords: latestVersion.totalRecords,
        validCount: latestVersion.validCount,
        invalidCount: latestVersion.invalidCount,
      }
    : null;

  const [modalState, setModalState] = useState<ModalState>("none");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<PadronUploadResult | null>(null);
  const [invalidVoters, setInvalidVoters] = useState<Voter[]>([]);
  const [pendingRows, setPendingRows] = useState<Voter[] | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!event?.id) return;
    dispatch(
      setSelectedElection({
        id: event.id,
        name: event.name,
      }),
    );
  }, [dispatch, event?.id, event?.name]);

  const navigateTo = (step: "cargos" | "planchas" | "padron" | "review" | "status") => {
    router.push(buildElectionConfigPath(actualElectionId, step));
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setFixError(null);
    try {
      const parsed = await parsePadronCsv(selectedFile);
      setPendingRows(parsed.rows);
      setPendingFileName(selectedFile.name);
      setUploadResult({
        totalRecords: parsed.totalRecords,
        validCount: parsed.validCount,
        invalidCount: parsed.invalidCount,
        voters: parsed.rows,
      });
      setModalState("summary");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo leer el CSV"));
      setModalState("none");
    }
  };

  const handleContinueFromSummary = async () => {
    if (!pendingRows || !pendingFileName || !uploadResult) {
      setModalState("none");
      return;
    }

    if (uploadResult.invalidCount > 0) {
      setModalState("none");
      return;
    }

    setModalState("uploading");
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const csvContent = buildUploadCsv(pendingRows);
      const uploadFile = new File([csvContent], pendingFileName, { type: "text/csv" });

      const result = await importPadron({
        eventId: actualElectionId,
        file: uploadFile,
      }).unwrap();

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult({
        totalRecords: result.totalRecords,
        validCount: result.validCount,
        invalidCount: result.invalidCount,
        voters: [],
      });
      setPendingRows(null);
      setPendingFileName(null);
      setModalState("none");
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setError(getErrorMessage(err, "Error al cargar el archivo"));
      setModalState("none");
    }
  };

  const handleOpenFixModal = useCallback(async () => {
    if (pendingRows) {
      const invalids = pendingRows.filter((voter) => voter.status === "invalid");
      setInvalidVoters(invalids);
      setFixError(null);
      setModalState("fixing");
      return;
    }

    const invalids = voters.filter((voter) => voter.status === "invalid");
    if (invalids.length === 0) {
      setError(
        invalidCount > 0
          ? "Los registros inválidos no se guardan en la base. Debes reemplazar el CSV con una versión corregida antes de continuar."
          : "No hay registros inválidos para corregir.",
      );
      setModalState("none");
      return;
    }

    setInvalidVoters(invalids);
    setFixError(null);
    setModalState("fixing");
  }, [invalidCount, pendingRows, voters]);

  const handleSaveCorrections = async (corrections: CorrectionInput[]) => {
    if (pendingRows) {
      const correctionMap = new Map(corrections.map((correction) => [correction.id, correction]));
      const updated = pendingRows.map((row) =>
        correctionMap.has(row.id)
          ? {
              ...row,
              carnet: correctionMap.get(row.id)?.carnet ?? row.carnet,
              enabled: correctionMap.get(row.id)?.enabled ?? row.enabled,
            }
          : row,
      );

      const revalidated = revalidateRows(updated);
      const nextInvalidCount = revalidated.filter((voter) => voter.status === "invalid").length;
      const nextValidCount = revalidated.length - nextInvalidCount;

      setPendingRows(revalidated);
      setUploadResult({
        totalRecords: revalidated.length,
        validCount: nextValidCount,
        invalidCount: nextInvalidCount,
        voters: revalidated,
      });

      if (nextInvalidCount > 0) {
        setFixError("Aún existen registros inválidos. Corrige los marcados.");
        return;
      }

      setFixError(null);
      setModalState("summary");
      return;
    }

    setError("La corrección de votantes aún no está implementada en el backend");
    setModalState("none");
  };

  const handleDeleteVoter = async (voterId: string) => {
    if (pendingRows) {
      const updated = pendingRows.filter((row) => row.id !== voterId);
      const revalidated = revalidateRows(updated);
      const nextInvalidCount = revalidated.filter((voter) => voter.status === "invalid").length;
      const nextValidCount = revalidated.length - nextInvalidCount;

      setPendingRows(revalidated);
      setInvalidVoters((prev) => prev.filter((row) => row.id !== voterId));
      setUploadResult({
        totalRecords: revalidated.length,
        validCount: nextValidCount,
        invalidCount: nextInvalidCount,
        voters: revalidated,
      });
      setFixError(null);
      return;
    }

    setError("La eliminación de votantes persistidos aún no está implementada en el backend");
  };

  const handleDownloadCsv = async () => {
    if (!latestVersion) return;

    try {
      const result = await downloadPadronCsv({
        eventId: actualElectionId,
        padronVersionId: latestVersion.padronVersionId,
      }).unwrap();

      const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo descargar el padrón"));
    }
  };

  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
      />
    );
  }

  if (
    eventLoadFailed ||
    rolesLoadFailed ||
    optionsLoadFailed ||
    padronVersionsLoadFailed ||
    votersLoadFailed
  ) {
    return (
      <ConfigPageFallback
        title="No se pudo cargar Padrón"
        message="Alguno de los datos necesarios para este paso falló al cargar. Reintenta antes de continuar."
        actionLabel="Reintentar"
        onAction={() => {
          void refetchEvent();
        }}
      />
    );
  }

  if (!loadingEvent && !event) {
    return (
      <ConfigPageFallback
        title="Votación no encontrada"
        message="La votación no existe o la respuesta llegó incompleta. Vuelve al listado y selecciónala de nuevo."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
      />
    );
  }

  if (hasDraftAlreadyStarted(event)) {
    return (
      <ConfigPageFallback
        title="La votación ya venció antes de completarse"
        message="Como la hora de inicio ya pasó y el evento sigue en borrador, ya no debe seguir configurándose. Elimínalo desde la lista de votaciones."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            {event?.name || "Cargando..."}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}

          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={3}
              completedSteps={[
                ...(hasPositions ? [1] : []),
                ...(hasPartiesWithCandidates ? [2] : []),
                ...(isPadronReady ? [3] : []),
              ] as ConfigStep[]}
              onStepChange={(step) => {
                if (step === 1) navigateTo("cargos");
                if (step === 2) navigateTo("planchas");
              }}
              canNavigate={() => true}
            />
          </div>

          <p className="text-gray-600 mb-6">Paso 3 de 3: Sube el padrón electoral.</p>

          {loading && !isLoaded ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando...</p>
            </div>
          ) : isLoaded && file ? (
            <LoadedPadronView
              file={file}
              voters={filteredVoters}
              totalVoters={totalVoters}
              validCount={validCount}
              invalidCount={invalidCount}
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onSearchChange={setSearch}
              onFixInvalid={handleOpenFixModal}
              onReplaceFile={() => replaceFileInputRef.current?.click()}
              onDeleteFile={() => setModalState("deleteConfirm")}
              onDownloadCsv={handleDownloadCsv}
              onFinish={() => navigateTo("review")}
              loading={loadingVoters || importing}
              downloading={downloadingCsv}
            />
          ) : (
            <PadronDropzone onFileSelect={handleFileSelect} disabled={importing} />
          )}
        </div>
      </div>

      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".csv"
        onChange={async (eventInput) => {
          const selectedFile = eventInput.target.files?.[0];
          if (!selectedFile) return;
          await handleFileSelect(selectedFile);
          eventInput.target.value = "";
        }}
        className="hidden"
      />

      <UploadProgressModal isOpen={modalState === "uploading"} progress={uploadProgress} title="Cargando padrón..." />
      <UploadProgressModal isOpen={modalState === "revalidating"} progress={uploadProgress} title="Actualizando padrón..." />

      <UploadSummaryModal
        isOpen={modalState === "summary"}
        onClose={() => setModalState("none")}
        validCount={uploadResult?.validCount || validCount}
        invalidCount={uploadResult?.invalidCount || invalidCount}
        onContinue={handleContinueFromSummary}
        onFix={handleOpenFixModal}
        continueLabel={uploadResult?.invalidCount ? "Continuar" : "Subir padrón"}
        disableContinue={Boolean(uploadResult && uploadResult.invalidCount > 0)}
      />

      <FixInvalidModal
        isOpen={modalState === "fixing"}
        onClose={() => setModalState("none")}
        invalidVoters={invalidVoters}
        onSave={handleSaveCorrections}
        onDelete={handleDeleteVoter}
        isLoading={false}
        error={fixError}
      />

      <Modal2
        isOpen={modalState === "deleteConfirm"}
        onClose={() => setModalState("none")}
        title="Eliminar padrón"
        size="sm"
        type="plain"
      >
        <div className="space-y-4">
          <p className="text-gray-700">¿Estás seguro de eliminar el padrón "{file?.fileName}"?</p>
          <p className="text-sm text-gray-500">
            Se eliminarán todos los registros cargados. Tendrás que subir un nuevo archivo.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalState("none")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setError("La eliminación del padrón aún no está implementada en el backend");
                setModalState("none");
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
}
