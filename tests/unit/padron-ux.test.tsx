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
});
