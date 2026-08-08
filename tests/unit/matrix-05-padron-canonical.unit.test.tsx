import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import PadronDropzone from "@/features/electionConfig/components/PadronDropzone";
import FixInvalidModal from "@/features/electionConfig/components/FixInvalidModal";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";
import PadronObservationsModal from "@/features/electionConfig/components/PadronObservationsModal";
import UploadProgressModal from "@/features/electionConfig/components/UploadProgressModal";
import UploadSummaryModal from "@/features/electionConfig/components/UploadSummaryModal";
import {
  getGeminiDraftSummary,
  isBlockingGeminiObservation,
  type GeminiPadronDraft,
} from "@/features/electionConfig/data/padronGeminiClient";
import type { PadronFile, Voter } from "@/features/electionConfig/types";

const padronFile: PadronFile = {
  fileName: "padron-vigente.pdf",
  uploadedAt: "2026-04-18T12:00:00.000Z",
  totalRecords: 1,
  validCount: 1,
  invalidCount: 0,
};

const disabledVoter: Voter = {
  id: "voter-1",
  rowNumber: 1,
  carnet: "1234567",
  fullName: "Ana Perez",
  enabled: false,
  status: "valid",
};

const renderLoadedPadron = (props: Partial<ComponentProps<typeof LoadedPadronView>> = {}) =>
  render(
    <LoadedPadronView
      file={padronFile}
      voters={[disabledVoter]}
      totalVoters={1}
      validCount={1}
      invalidCount={0}
      page={1}
      totalPages={1}
      pageSize={10}
      onPageChange={vi.fn()}
      onSearchChange={vi.fn()}
      {...props}
    />,
  );

describe("MX-05 | Padrón, staging, elegibilidad y archivos | Unitarias canónicas", () => {
  it("[MX-05][PAD-UI-P1-001][UNITARIA] representa la guía, ejemplo, progreso, resumen y observaciones reales", async () => {
    const user = userEvent.setup();

    render(
      <>
        <PadronDropzone onFileSelect={vi.fn()} onManualStart={vi.fn()} />
        <UploadProgressModal isOpen progress={42} />
        <UploadSummaryModal
          isOpen
          onClose={vi.fn()}
          totalCount={12}
          enabledCount={8}
          disabledCount={2}
          observedCount={2}
          onContinue={vi.fn()}
          continueLabel="Ir al padrón"
        />
        <PadronObservationsModal
          isOpen
          errors={[
            {
              code: "GEMINI_OBSERVATION",
              message: "No se pudo leer el carnet de la fila.",
              rowIndex: 4,
              rawValue: "12?45A",
            },
          ]}
          onClose={vi.fn()}
          onAddRecord={vi.fn()}
        />
      </>,
    );

    expect(screen.getByText("¿No conoces el formato?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear padrón manualmente" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Ver ejemplo de padrón" }));
    expect(
      screen.getByRole("img", { name: "Ejemplo visual del formato del padrón" }),
    ).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("No cierres esta ventana.")).toBeInTheDocument();
    expect(screen.getByText("Resultado del análisis")).toBeInTheDocument();
    expect(screen.getByText("Observados")).toBeInTheDocument();
    expect(screen.getByText("No se pudo leer el carnet de la fila.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar registro manual" })).toBeEnabled();
  });

  it("[MX-05][PAD-PRC-P0-001][UNITARIA] clasifica observaciones y bloquea resultados sin registros", () => {
    const informative = {
      code: "GEMINI_OBSERVATION",
      message: "Encabezado de columna identificado y omitido",
      rowIndex: 1,
      rawValue: null,
    };
    const blocking = {
      code: "GEMINI_OBSERVATION",
      message: "No se pudo determinar el CI completo de la fila",
      rowIndex: 4,
      rawValue: "12?45A",
    };
    const usableDraft: GeminiPadronDraft = {
      fileName: "padron.pdf",
      uploadedAt: "2026-04-18T12:00:00.000Z",
      sourceType: "PDF_GEMINI",
      analysisProvider: "GEMINI_CLIENT",
      model: "gemini",
      records: [
        {
          id: "record-1",
          carnet: "1234567",
          enabled: true,
          sourceKind: "PARSED",
          sourceRow: 2,
          updatedAt: null,
        },
      ],
      observations: [informative],
    };
    const emptyDraft: GeminiPadronDraft = {
      ...usableDraft,
      records: [],
      observations: [informative],
    };

    expect(isBlockingGeminiObservation(informative)).toBe(false);
    expect(isBlockingGeminiObservation(blocking)).toBe(true);
    expect(getGeminiDraftSummary(usableDraft)).toMatchObject({
      totalCount: 1,
      observedCount: 0,
    });
    expect(getGeminiDraftSummary(emptyDraft)).toMatchObject({
      totalCount: 0,
      observedCount: 0,
    });
    expect(emptyDraft.records).toHaveLength(0);
  });

  it("[MX-05][PAD-NRM-P0-001][UNITARIA] normaliza carnet y rechaza valores fuera del contrato de formato", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <FixInvalidModal
        isOpen
        onClose={vi.fn()}
        invalidVoters={[
          {
            ...disabledVoter,
            id: "invalid-1",
            carnet: "inválido",
            status: "invalid",
            invalidReason: "invalid_format",
          },
        ]}
        onSave={onSave}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
      />,
    );

    const carnetInput = screen.getByPlaceholderText("Ingresa carnet válido");
    const saveButton = screen.getByRole("button", { name: "Guardar correcciones" });

    await user.clear(carnetInput);
    expect(saveButton).toBeDisabled();
    await user.type(carnetInput, "ABCD");
    expect(saveButton).toBeDisabled();
    await user.clear(carnetInput);
    await user.type(carnetInput, "1234");
    expect(saveButton).toBeDisabled();
    await user.clear(carnetInput);
    await user.type(carnetInput, "12@345");
    expect(saveButton).toBeDisabled();
    await user.clear(carnetInput);
    await user.type(carnetInput, " 12.345-ab ");
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);
    expect(onSave).toHaveBeenCalledWith([
      { id: "invalid-1", carnet: "12345AB", enabled: false },
    ]);

    await user.clear(carnetInput);
    await user.type(carnetInput, "1234567890AB");
    expect(saveButton).toBeEnabled();
    await user.clear(carnetInput);
    await user.type(carnetInput, "12345678901");
    expect(saveButton).toBeDisabled();
  });

  it("[MX-05][PAD-STA-P1-002][UNITARIA] permite habilitar electores existentes sin mutaciones estructurales", () => {
    const onEnableVoter = vi.fn();

    renderLoadedPadron({
      readOnly: true,
      onEnableVoter,
      onAddRecord: vi.fn(),
      onReplaceFile: vi.fn(),
      onDeleteFile: vi.fn(),
      onFinish: vi.fn(),
    });

    expect(screen.getByText("Registros cargados")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Habilitar" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /agregar registro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reemplazar documento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar archivo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalizar configuración/i })).not.toBeInTheDocument();
  });

  it("[MX-05][PAD-STA-P0-003][UNITARIA] conserva lectura y bloquea carga, edición, reemplazo, eliminación y confirmación", () => {
    render(
      <>
        <PadronDropzone disabled onFileSelect={vi.fn()} onManualStart={vi.fn()} />
        <LoadedPadronView
          file={padronFile}
          voters={[disabledVoter]}
          totalVoters={1}
          validCount={1}
          invalidCount={0}
          page={1}
          totalPages={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onSearchChange={vi.fn()}
          onAddRecord={vi.fn()}
          onReplaceFile={vi.fn()}
          onDeleteFile={vi.fn()}
          onFinish={vi.fn()}
          onFixInvalid={vi.fn()}
          readOnly
        />
      </>,
    );

    expect(screen.getByText("Registros cargados")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar archivo" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Habilitar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /agregar registro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /corregir inválidos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reemplazar documento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar archivo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalizar configuración/i })).not.toBeInTheDocument();
  });
});
