import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import AddPositionModal from "@/features/electionConfig/components/AddPositionModal";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";

const createElectionMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/features/elections/data/useElectionRepository", () => ({
  useCreateElection: () => ({
    createElection: createElectionMock,
    creating: false,
  }),
}));

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div>{title ? <h2>{title}</h2> : null}{children}</div> : null),
}));

describe("election creation and configuration P0 components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps creation disabled while required wizard fields are empty", async () => {
    render(<CreateElectionWizard />);

    expect(screen.getByText("Crear Nueva Votación")).toBeInTheDocument();
    expect(screen.getByLabelText("¿A qué institución pertenece?")).toBeInTheDocument();
    expect(screen.getByLabelText("¿Cuál es el objetivo o descripción?")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    });
  });

  it("validates schedule order and does not submit invalid dates", async () => {
    const user = userEvent.setup();

    render(<CreateElectionWizard />);

    await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Eleccion normal");
    await user.type(
      screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
      "Elegir representantes institucionales",
    );
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T18:00");
    await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T12:00");
    await user.type(
      screen.getByLabelText("¿Cuándo se muestran los resultados?"),
      "2027-06-01T12:01",
    );
    await user.tab();

    expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
    expect(screen.getByText("Debe ser posterior a la fecha de apertura")).toBeInTheDocument();
    expect(createElectionMock).not.toHaveBeenCalled();
  }, 10000);

  it("submits the create election payload and navigates to cargos for normal elections", async () => {
    createElectionMock.mockResolvedValue({ id: "evt-created" });

    render(<CreateElectionWizard />);

    fireEvent.change(screen.getByLabelText("¿A qué institución pertenece?"), {
      target: { value: "Eleccion normal" },
    });
    fireEvent.change(screen.getByLabelText("¿Cuál es el objetivo o descripción?"), {
      target: { value: "Elegir representantes institucionales" },
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => {
      expect(screen.getByLabelText("¿Cuándo abre la votación?")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("¿Cuándo abre la votación?"), {
      target: { value: "2027-06-01T12:00" },
    });
    fireEvent.change(screen.getByLabelText("¿Cuándo cierra la votación?"), {
      target: { value: "2027-06-01T18:00" },
    });
    fireEvent.change(screen.getByLabelText("¿Cuándo se muestran los resultados?"), {
      target: { value: "2027-06-01T19:00" },
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "CREAR" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(createElectionMock).toHaveBeenCalledWith({
        institution: "Eleccion normal",
        description: "Elegir representantes institucionales",
        isReferendum: false,
        votingStartDate: "2027-06-01T12:00",
        votingEndDate: "2027-06-01T18:00",
        resultsDate: "2027-06-01T19:00",
      });
    });
    expect(navigateMock).toHaveBeenCalledWith(
      "/votacion/elecciones/evt-created/config/cargos",
      { replace: true },
    );
  });

  it("validates and submits a new cargo name", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <AddPositionModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        isLoading={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Guardar Cargo" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("¿Por qué cargo se votará?"), {
      target: { value: "P" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cargo" }));

    expect(await screen.findByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("¿Por qué cargo se votará?"), {
      target: { value: "Presidencia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cargo" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("Presidencia");
    });
  });

});
