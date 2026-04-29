import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import PadronDropzone from "@/features/electionConfig/components/PadronDropzone";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";

describe("padron UX helpers", () => {
  it("shows a compact visual guide under the dropzone", () => {
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

  it("opens a compact help modal with the expected padron guidance", async () => {
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

  it("shows the PDF export button without affecting the loaded table actions", async () => {
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

  it("keeps the padron table visible in read-only mode without habilitar actions", () => {
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

  it("shows habilitar in limited post-publication mode when the action is enabled", () => {
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
});
