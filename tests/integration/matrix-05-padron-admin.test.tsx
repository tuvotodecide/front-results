import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";
import PadronDropzone from "@/features/electionConfig/components/PadronDropzone";
import PadronRecordModal from "@/features/electionConfig/components/PadronRecordModal";
import PadronStagingView from "@/features/electionConfig/components/PadronStagingView";
import type { PadronFile, Voter } from "@/features/electionConfig/types";

const file: PadronFile = {
  fileName: "padron.pdf",
  uploadedAt: "2026-04-18T12:00:00.000Z",
  totalRecords: 2,
  validCount: 2,
  invalidCount: 0,
  sourceType: "PDF",
};

const voters: Voter[] = [
  {
    id: "entry-1",
    rowNumber: 1,
    carnet: "1234567",
    fullName: "",
    enabled: true,
    status: "valid",
  },
  {
    id: "entry-2",
    rowNumber: 2,
    carnet: "7654321",
    fullName: "",
    enabled: false,
    status: "valid",
  },
];

describe("MX-05 | Padrón, staging, elegibilidad y archivos | integración de componentes", () => {
  it("[MX-05][PAD-LST-P0-001][INTEGRACION] muestra padrón vigente, búsqueda y paginación", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onPageChange = vi.fn();

    render(
      <LoadedPadronView
        file={file}
        voters={voters}
        totalVoters={12}
        validCount={10}
        invalidCount={2}
        page={1}
        totalPages={2}
        pageSize={10}
        onPageChange={onPageChange}
        onSearchChange={onSearchChange}
      />,
    );

    const totalCard = screen.getByText("Total Registros").closest("div")?.parentElement;
    const validCard = screen.getByText("Válidos").closest("div")?.parentElement;
    const invalidCard = screen.getByText("Inválidos").closest("div")?.parentElement;

    expect(totalCard).not.toBeNull();
    expect(validCard).not.toBeNull();
    expect(invalidCard).not.toBeNull();
    expect(within(totalCard!).getByText("12")).toBeInTheDocument();
    expect(within(validCard!).getByText("10")).toBeInTheDocument();
    expect(within(invalidCard!).getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    const nextPage = screen.getByRole("button", { name: "Siguiente" });
    expect(nextPage).toBeEnabled();

    const search = screen.getByPlaceholderText("Buscar por carnet");
    await user.type(search, "7654321");
    const form = search.closest("form");
    if (!form) throw new Error("No se encontró el formulario de búsqueda del padrón.");
    fireEvent.submit(form);
    await user.click(nextPage);

    expect(onSearchChange).toHaveBeenCalledWith("7654321");
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("[MX-05][PAD-LST-P1-002][INTEGRACION] muestra staging, selección, búsqueda y paginación", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onPageChange = vi.fn();
    const onToggleRecordSelection = vi.fn();

    render(
      <PadronStagingView
        file={file}
        voters={voters}
        totalVoters={12}
        enabledCount={1}
        disabledCount={1}
        observedCount={1}
        page={1}
        totalPages={2}
        pageSize={10}
        onPageChange={onPageChange}
        onSearchChange={onSearchChange}
        onToggleRecordSelection={onToggleRecordSelection}
      />,
    );

    expect(screen.getByText("Observados")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar 1234567" }));
    await user.type(screen.getByPlaceholderText("Buscar por carnet"), "7654321");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onToggleRecordSelection).toHaveBeenCalledWith("entry-1");
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("[MX-05][PAD-UPL-P0-001][INTEGRACION] acepta formato permitido y bloquea extensión ajena antes de enviar", () => {
    const onFileSelect = vi.fn();
    render(<PadronDropzone onFileSelect={onFileSelect} />);

    const dropzone = screen
      .getByText("Arrastra aquí el archivo del padrón electoral")
      .closest("div");
    if (!dropzone) throw new Error("No se encontró la zona de carga del padrón.");

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File(["png"], "padron.png", { type: "image/png" })],
      },
    });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File(["texto"], "padron.txt", { type: "text/plain" })],
      },
    });

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "padron.png", type: "image/png" }),
    );
  });

  it("[MX-05][PAD-ROW-P0-002][INTEGRACION] expone inhabilitación en staging", () => {
    render(
      <PadronStagingView
        file={file}
        voters={[voters[1]]}
        totalVoters={1}
        enabledCount={0}
        disabledCount={1}
        observedCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(screen.getByText("Inhabilitados")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("[MX-05][PAD-DEL-P0-001][INTEGRACION] solicita eliminación múltiple únicamente para filas seleccionadas", async () => {
    const user = userEvent.setup();
    const onToggleRecordSelection = vi.fn();
    const onBulkDeleteSelected = vi.fn();

    render(
      <PadronStagingView
        file={file}
        voters={voters}
        totalVoters={2}
        enabledCount={1}
        disabledCount={1}
        observedCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        selectedVoterIds={["entry-1"]}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onToggleRecordSelection={onToggleRecordSelection}
        onBulkDeleteSelected={onBulkDeleteSelected}
      />,
    );

    await user.click(screen.getByRole("button", { name: /eliminar seleccionados \(1\)/i }));
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar 7654321" }));

    expect(onBulkDeleteSelected).toHaveBeenCalledTimes(1);
    expect(onToggleRecordSelection).toHaveBeenCalledWith("entry-2");
  });

  it("[MX-05][PAD-EDT-P0-001][INTEGRACION] edita un registro y conserva un error recuperable", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("El carnet ya existe en el staging."));

    render(
      <PadronRecordModal
        isOpen
        mode="edit"
        initialCi="1234567"
        initialEnabled={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Editar registro del padrón" });
    const input = within(dialog).getByRole("textbox");
    await user.clear(input);
    await user.type(input, "7654321");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    expect(onSubmit).toHaveBeenCalledWith({ ci: "7654321", enabled: false });
    expect(await within(dialog).findByText("El carnet ya existe en el staging.")).toBeInTheDocument();
  });

  it("[MX-05][PAD-RPL-P1-001][INTEGRACION] expone reemplazo para actualizar el archivo de trabajo", async () => {
    const user = userEvent.setup();
    const onReplaceFile = vi.fn();

    render(
      <LoadedPadronView
        file={file}
        voters={voters}
        totalVoters={2}
        validCount={2}
        invalidCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onReplaceFile={onReplaceFile}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reemplazar documento" }));
    expect(onReplaceFile).toHaveBeenCalledTimes(1);
  });

  it("[MX-05][PAD-STA-P0-001][INTEGRACION] habilita controles estructurales en modo FULL", () => {
    render(
      <LoadedPadronView
        file={file}
        voters={voters}
        totalVoters={2}
        validCount={2}
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
      />,
    );

    expect(screen.getByRole("button", { name: /agregar registro/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reemplazar documento" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Eliminar archivo" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /finalizar/i })).toBeEnabled();
  });

  it("[MX-05][PAD-PER-P0-001][INTEGRACION] no expone mutaciones cuando la superficie no recibe permiso", () => {
    render(
      <LoadedPadronView
        file={file}
        voters={voters}
        totalVoters={2}
        validCount={2}
        invalidCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        readOnly
      />,
    );

    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /agregar registro/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reemplazar documento" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar archivo" })).toBeNull();
  });

  it("[MX-05][PAD-CON-P1-001][INTEGRACION] bloquea una segunda eliminación mientras la primera está en curso", () => {
    render(
      <PadronStagingView
        file={file}
        voters={voters}
        totalVoters={2}
        enabledCount={1}
        disabledCount={1}
        observedCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        selectedVoterIds={["entry-1"]}
        bulkDeleting
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onToggleRecordSelection={vi.fn()}
        onBulkDeleteSelected={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /eliminar seleccionados \(1\)/i }),
    ).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Seleccionar 1234567" })).toBeDisabled();
  });
});
