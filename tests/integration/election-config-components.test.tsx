import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateNewsModal from "@/features/electionConfig/components/CreateNewsModal";
import LoadedPadronView from "@/features/electionConfig/components/LoadedPadronView";
import UploadSummaryModal from "@/features/electionConfig/components/UploadSummaryModal";
import type { PadronFile, Voter } from "@/features/electionConfig/types";

const padronFile: PadronFile = {
  fileName: "Padrón confirmado",
  uploadedAt: "2026-04-17T12:00:00.000Z",
  totalRecords: 2,
  validCount: 2,
  invalidCount: 0,
  sourceType: "CSV_LEGACY",
};

const voters: Voter[] = [
  {
    id: "voter-1",
    rowNumber: 1,
    carnet: "1234567",
    fullName: "",
    enabled: true,
    status: "valid",
  },
  {
    id: "voter-2",
    rowNumber: 2,
    carnet: "7654321",
    fullName: "",
    enabled: false,
    status: "valid",
  },
];

describe("election config UI components", () => {
  it("creates news with a JSON-shaped payload and imageUrl only", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
      <CreateNewsModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    expect(container.querySelector('input[type="file"]')).toBeNull();

    await user.type(screen.getByLabelText("Título"), "Aviso importante");
    await user.type(screen.getByLabelText("Descripción"), "Mensaje para votantes");
    await user.type(screen.getByLabelText("Enlace opcional"), "https://example.com");
    await user.type(
      screen.getByLabelText("URL de imagen (opcional)"),
      "https://example.com/imagen.png",
    );
    await user.click(screen.getByRole("button", { name: "Publicar noticia" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Aviso importante",
      body: "Mensaje para votantes",
      link: "https://example.com",
      imageUrl: "https://example.com/imagen.png",
    });
  });

  it("keeps the analysis summary balanced in a 2x2 responsive grid", () => {
    render(
      <UploadSummaryModal
        isOpen
        onClose={vi.fn()}
        totalCount={6}
        enabledCount={5}
        disabledCount={1}
        observedCount={0}
        onContinue={vi.fn()}
        continueLabel="Ir al padrón"
      />,
    );

    expect(screen.getByText("Resultado del análisis")).toBeInTheDocument();
    expect(document.body.innerHTML).toContain("sm:grid-cols-2");
    expect(document.body.innerHTML).not.toContain("xl:grid-cols-4");
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Habilitados")).toBeInTheDocument();
    expect(screen.getByText("Inhabilitados")).toBeInTheDocument();
    expect(screen.getByText("Observados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /corregir/i })).not.toBeInTheDocument();
  });

  it("shows confirmed padron directly editable without review/edit CTAs or CSV copy", () => {
    render(
      <LoadedPadronView
        file={padronFile}
        voters={voters}
        totalVoters={2}
        validCount={2}
        invalidCount={0}
        page={1}
        totalPages={1}
        pageSize={50}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onReplaceFile={vi.fn()}
        onDeleteFile={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.queryByText(/revisar padrón/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/editar padrón/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/csv/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reemplazar documento/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /eliminar archivo/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /finalizar configuración/i }),
    ).toBeEnabled();
  });

  it("keeps the final padron CTA visible but disabled while invalid rows exist", () => {
    render(
      <LoadedPadronView
        file={{ ...padronFile, invalidCount: 1 }}
        voters={[{ ...voters[0]!, status: "invalid", invalidReason: "invalid_format" }]}
        totalVoters={1}
        validCount={0}
        invalidCount={1}
        page={1}
        totalPages={1}
        pageSize={50}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    const footer = screen.getByRole("button", { name: /finalizar configuración/i });
    expect(footer).toBeDisabled();
    expect(within(footer).getByText("Finalizar configuración")).toBeInTheDocument();
  });
});
