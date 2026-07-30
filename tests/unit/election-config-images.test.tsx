import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, vi } from "vitest";
import CandidatesModal from "@/features/electionConfig/components/CandidatesModal";
import PartyModal from "@/features/electionConfig/components/PartyModal";

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div role="dialog">{title ? <h2>{title}</h2> : null}{children}</div> : null),
}));

describe("MX-04 | Creación y configuración de votaciones | Imágenes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: null | (() => void) = null;
      onloadend: null | (() => void) = null;
      onerror: null | (() => void) = null;

      readAsDataURL(file: File) {
        this.result = `data:${file.type};base64,mock-image`;
        this.onload?.();
        this.onloadend?.();
      }
    }

    vi.stubGlobal("FileReader", MockFileReader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ELE-IMG-P1-001 acepta logos de imagen y rechaza archivos no imagen", async () => {
    const onSave = vi.fn().mockResolvedValue({ id: "party-1", name: "Lista Verde" });

    render(
      <PartyModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        isLoading={false}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Ej: Movimiento Futuro"), {
      target: { value: "Lista Verde" },
    });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(["texto"], "logo.txt", { type: "text/plain" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar y Continuar" }));

    expect(screen.getByText("El logo es obligatorio")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(["logo"], "logo.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(screen.getByAltText("Logo preview")).toHaveAttribute(
        "src",
        expect.stringContaining("data:image/png"),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar y Continuar" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Lista Verde",
        logoBase64: expect.stringContaining("data:image/png"),
      }),
    );
  });

  it("ELE-IMG-P1-001 conserva foto existente de candidato en el payload", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <CandidatesModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        isLoading={false}
        positions={[{ id: "role-1", name: "Presidencia", electionId: "evt-1" }]}
        existingCandidates={[
          {
            id: "cand-1",
            positionId: "role-1",
            positionName: "Presidencia",
            fullName: "Ana Presidenta",
            photoUrl: "data:image/jpeg;base64,existing-candidate",
          },
        ]}
      />,
    );

    expect(screen.getByAltText("Foto candidato")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,existing-candidate",
    );
    fireEvent.change(screen.getByDisplayValue("Ana Presidenta"), {
      target: { value: "Ana Rectora" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Candidatos" }));

    expect(onSave).toHaveBeenCalledWith([
      {
        positionId: "role-1",
        positionName: "Presidencia",
        fullName: "Ana Rectora",
        photoBase64: "data:image/jpeg;base64,existing-candidate",
      },
    ]);
  });
});
