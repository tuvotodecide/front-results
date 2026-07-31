import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import PadronDropzone from "@/features/electionConfig/components/PadronDropzone";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";

describe("MX-05 | Padrón, staging, elegibilidad y archivos | Frontend", () => {
  it("PAD-UI-P1-001 | muestra guía compacta y entrada manual del padrón", () => {
    render(<PadronDropzone onFileSelect={vi.fn()} onManualStart={vi.fn()} />);

    expect(screen.getByText("¿No conoces el formato?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver ejemplo de padrón" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("El archivo debe mostrar una fila por persona, con su carnet y estado de habilitación."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/el documento debe mostrar los carnets/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear padrón manualmente" }),
    ).toBeInTheDocument();
  });

  it("PAD-UI-P1-001 | abre el modal de ejemplo con la guía esperada", async () => {
    const user = userEvent.setup();

    render(<PadronDropzone onFileSelect={vi.fn()} onManualStart={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Ver ejemplo de padrón" }));

    expect(
      screen.getByText(
        "El archivo debe mostrar una fila por persona, con su carnet y estado de habilitación.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Ejemplo visual del formato del padrón" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/cada fila debe mostrar carnet y estado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/evita imágenes borrosas o con sombras/i)).toBeInTheDocument();
  });

  it("PAD-DWN-P1-001 | muestra acción de descarga PDF sin alterar la tabla cargada", async () => {
    const user = userEvent.setup();
    const downloadPdfMock = vi.fn();

    render(
      <LoadedPadronView
        file={{
          fileName: "padron-confirmado.pdf",
          uploadedAt: "2026-04-18T12:00:00.000Z",
          totalRecords: 2,
          validCount: 1,
          invalidCount: 1,
        }}
        voters={[
          {
            id: "v1",
            rowNumber: 1,
            carnet: "123456",
            fullName: "",
            hasIdentity: true,
            enabled: true,
            status: "valid",
          },
        ]}
        totalVoters={1}
        validCount={1}
        invalidCount={1}
        page={1}
        totalPages={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onDownloadPdf={downloadPdfMock}
      />,
    );

    const button = screen.getByRole("button", { name: "Descargar padrón en PDF" });
    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(downloadPdfMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Registros cargados")).toBeInTheDocument();
  });

  it("PAD-STA-P0-003 | mantiene la tabla visible en modo solo lectura sin acciones", () => {
    render(
      <LoadedPadronView
        file={{
          fileName: "padron-vigente.pdf",
          uploadedAt: "2026-04-18T12:00:00.000Z",
          totalRecords: 2,
          validCount: 1,
          invalidCount: 1,
        }}
        voters={[
          {
            id: "v1",
            rowNumber: 1,
            carnet: "1234567",
            fullName: "Ana Perez",
            hasIdentity: true,
            enabled: false,
            status: "valid",
          },
        ]}
        totalVoters={1}
        validCount={1}
        invalidCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onReplaceFile={vi.fn()}
        onDeleteFile={vi.fn()}
        onFinish={vi.fn()}
        onAddRecord={vi.fn()}
        readOnly
      />,
    );

    expect(screen.getByText("Registros cargados")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Habilitar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /agregar registro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reemplazar archivo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar archivo/i })).not.toBeInTheDocument();
  });

  it("PAD-STA-P1-002 | muestra habilitar en modo limitado sin permitir alta nueva", () => {
    render(
      <LoadedPadronView
        file={{
          fileName: "padron-vigente.pdf",
          uploadedAt: "2026-04-18T12:00:00.000Z",
          totalRecords: 2,
          validCount: 1,
          invalidCount: 1,
        }}
        voters={[
          {
            id: "v1",
            rowNumber: 1,
            carnet: "1234567",
            fullName: "Ana Perez",
            hasIdentity: true,
            enabled: false,
            status: "valid",
          },
        ]}
        totalVoters={1}
        validCount={1}
        invalidCount={0}
        page={1}
        totalPages={1}
        pageSize={10}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onEnableVoter={vi.fn()}
        readOnly
      />,
    );

    expect(screen.getByText("Registros cargados")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Habilitar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /agregar registro/i })).not.toBeInTheDocument();
  });

  it("PAD-UPL-P0-001 | rechaza un archivo con extensión inválida antes de enviarlo", () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <PadronDropzone onFileSelect={onFileSelect} onManualStart={vi.fn()} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(["padron"], "padron.txt", { type: "text/plain" })],
      },
    });

    expect(onFileSelect).not.toHaveBeenCalled();
    expect(screen.getByText("PDF o imagen: JPG, JPEG, PNG o WEBP")).toBeInTheDocument();
  });

  it("PAD-UPL-P0-001 | acepta un PDF permitido desde el selector", () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <PadronDropzone onFileSelect={onFileSelect} onManualStart={vi.fn()} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(["%PDF"], "padron.pdf", { type: "application/pdf" })],
      },
    });

    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "padron.pdf" }));
  });
});
