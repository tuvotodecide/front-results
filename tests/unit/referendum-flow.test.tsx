import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import BallotPreview from "@/features/electionConfig/components/BallotPreview";
import PartiesTable from "@/features/electionConfig/components/PartiesTable";
import ElectionConfigCargos from "@/features/electionConfig/ElectionConfigCargos";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import PartyModal from "@/features/electionConfig/components/PartyModal";
import ConfigStepsTabs from "@/features/electionConfig/components/ConfigStepsTabs";

const createElectionMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ electionId: "evt-1" }),
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

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useCreateEventRoleMutation: vi.fn(),
  useUpdateEventRoleMutation: vi.fn(),
  useDeleteEventRoleMutation: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetPadronVersionsQuery: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";

const baseEvent = {
  id: "evt-1",
  name: "Consulta universitaria",
  objective: "¿Aprueba la nueva normativa institucional?",
  state: "DRAFT",
  status: "DRAFT",
  votingStart: "2026-06-01T12:00:00.000Z",
  votingEnd: "2026-06-01T18:00:00.000Z",
  resultsPublishAt: "2026-06-01T19:00:00.000Z",
  publishDeadline: "2026-06-01T06:00:00.000Z",
};

const referendumParty = {
  id: "opt-1",
  electionId: "evt-1",
  name: "Sí",
  colorHex: "#459151",
  createdAt: "2026-01-01T00:00:00.000Z",
  candidates: [
    {
      id: "cand-1",
      partyId: "opt-1",
      positionId: "CONSULTA",
      positionName: "CONSULTA",
      fullName: "Sí, apruebo",
      photoUrl: "",
    },
  ],
};

describe("referendum minimal flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
      data: { ...baseEvent, isReferendum: true },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
      data: [{ id: "role-1", eventId: "evt-1", name: "CONSULTA", maxWinners: 1 }],
      isLoading: false,
    } as any);
    vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({
      data: [],
    } as any);
    vi.mocked(votingEvents.useGetPadronVersionsQuery).mockReturnValue({
      data: [],
    } as any);
    vi.mocked(votingEvents.useCreateEventRoleMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useUpdateEventRoleMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useDeleteEventRoleMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);
  });

  it("creates a normal election with isReferendum false by default", async () => {
    const user = userEvent.setup();
    createElectionMock.mockResolvedValue({ id: "evt-normal" });

    render(<CreateElectionWizard />);

    await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección normal");
    await user.type(
      screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
      "Elegir representantes institucionales",
    );
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
    await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
    await user.type(
      screen.getByLabelText("¿Cuándo se muestran los resultados?"),
      "2027-06-01T19:00",
    );
    await user.click(screen.getByRole("button", { name: "CREAR" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(createElectionMock).toHaveBeenCalledWith(
        expect.objectContaining({ isReferendum: false }),
      );
    });
  });

  it("creates a referendum and shows the irreversibility warning", async () => {
    const user = userEvent.setup();
    createElectionMock.mockResolvedValue({ id: "evt-ref" });
    navigateMock.mockReset();

    render(<CreateElectionWizard />);

    await user.click(screen.getByRole("switch", { name: "¿Es referéndum?" }));

    expect(
      screen.getByText(/Después no podrás cambiar el tipo de votación/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Nombre del referéndum"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Pregunta del referéndum"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /activa esta opción si la votación será un referéndum con una pregunta y opciones de respuesta/i,
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre del referéndum"), "Consulta");
    await user.type(
      screen.getByLabelText("Pregunta del referéndum"),
      "¿Aprueba la nueva normativa institucional?",
    );

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
    await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
    await user.type(
      screen.getByLabelText("¿Cuándo se muestran los resultados?"),
      "2027-06-01T19:00",
    );
    await user.click(screen.getByRole("button", { name: "CREAR" }));

    expect(await screen.findByText("¿Crear referéndum?")).toBeInTheDocument();
    expect(
      screen.getByText(/después de crear este referéndum, no podrás cambiar su tipo/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(createElectionMock).toHaveBeenCalledWith(
        expect.objectContaining({ isReferendum: true }),
      );
    });
    expect(navigateMock).toHaveBeenCalledWith(
      "/votacion/elecciones/evt-ref/config/planchas",
      { replace: true },
    );
  });

  it("requires question marks in the referendum question", async () => {
    const user = userEvent.setup();

    render(<CreateElectionWizard />);

    await user.click(screen.getByRole("switch", { name: "¿Es referéndum?" }));
    await user.type(screen.getByLabelText("Nombre del referéndum"), "Consulta");
    await user.type(
      screen.getByLabelText("Pregunta del referéndum"),
      "Aprueba la nueva normativa institucional",
    );
    await user.tab();

    const nextButton = screen.getByRole("button", { name: "Siguiente" });
    expect(nextButton).toBeDisabled();
    expect(
      screen.getByText("Escribe la pregunta con signos de interrogación"),
    ).toBeInTheDocument();
  });

  it("uses the referendum description as the ballot preview title and hides CONSULTA", () => {
    render(
      <BallotPreview
        parties={[referendumParty]}
        isReferendum
        question="¿Aprueba la nueva normativa institucional?"
      />,
    );

    expect(screen.getByText("¿Aprueba la nueva normativa institucional?")).toBeInTheDocument();
    expect(screen.getByText("Selecciona la opción de tu preferencia")).toBeInTheDocument();
    expect(screen.getByText("Opción 1")).toBeInTheDocument();
    expect(screen.getAllByText("Sí")).toHaveLength(1);
    expect(screen.queryByText("CONSULTA:")).not.toBeInTheDocument();
  });

  it("keeps the normal ballot preview unchanged when not referendum", () => {
    render(<BallotPreview parties={[referendumParty]} />);

    expect(screen.getByText("Elige a tu candidato")).toBeInTheDocument();
    expect(screen.getByText("Selecciona al candidato de tu preferencia")).toBeInTheDocument();
    expect(screen.getByText("CONSULTA:")).toBeInTheDocument();
  });

  it("renders referendum parties as options without exposing the technical role", () => {
    render(<PartiesTable parties={[referendumParty]} isReferendum />);

    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("Opción")).toBeInTheDocument();
    expect(screen.queryByText("Respuesta configurada")).not.toBeInTheDocument();
    expect(screen.queryByText("CONSULTA:")).not.toBeInTheDocument();
  });

  it("redirects referendum cargos directly to options", async () => {
    navigateMock.mockReset();
    render(<ElectionConfigCargos />);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/votacion/elecciones/evt-1/config/planchas",
        { replace: true },
      );
    });
  });

  it("shows only options and padrón as visible tabs in referendum", () => {
    render(
      <ConfigStepsTabs
        currentStep={2}
        completedSteps={[2]}
        isReferendum
      />,
    );

    expect(screen.getByText("1. Opciones")).toBeInTheDocument();
    expect(screen.getByText("2. Padrón")).toBeInTheDocument();
    expect(screen.queryByText("1. Consulta")).not.toBeInTheDocument();
    expect(screen.queryByText("3. Padrón")).not.toBeInTheDocument();
  });

  it("renders the referendum option modal without logo upload and with optional colors", () => {
    render(
      <PartyModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn(async () => referendumParty as any)}
        isLoading={false}
        isReferendum
      />,
    );

    expect(screen.getByText("Agregar opción")).toBeInTheDocument();
    expect(screen.getByText("Nombre de la opción")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej: Sí")).toBeInTheDocument();
    expect(screen.getByText("Colores de la opción")).toBeInTheDocument();

    expect(screen.queryByText("Logo *")).not.toBeInTheDocument();
    expect(screen.queryByText(/arrastra tu logo aquí/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar opción" })).toBeInTheDocument();
  });
});
