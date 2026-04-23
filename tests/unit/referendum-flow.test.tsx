import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import BallotPreview from "@/features/electionConfig/components/BallotPreview";
import PartiesTable from "@/features/electionConfig/components/PartiesTable";
import ElectionConfigCargos from "@/features/electionConfig/ElectionConfigCargos";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";

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

    render(<CreateElectionWizard />);

    await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Consulta");
    await user.type(
      screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
      "¿Aprueba la nueva normativa institucional?",
    );
    await user.click(screen.getByRole("switch", { name: "¿Es referéndum?" }));

    expect(
      screen.getByText(/ya no podrás cambiar este tipo de votación/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
    await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
    await user.type(
      screen.getByLabelText("¿Cuándo se muestran los resultados?"),
      "2027-06-01T19:00",
    );
    await user.click(screen.getByRole("button", { name: "CREAR" }));

    expect(await screen.findByText("¿Crear votación?")).toBeInTheDocument();
    expect(screen.getByText(/este tipo quedará fijo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(createElectionMock).toHaveBeenCalledWith(
        expect.objectContaining({ isReferendum: true }),
      );
    });
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
    expect(screen.getByText("Alternativa:")).toBeInTheDocument();
    expect(screen.queryByText("CONSULTA:")).not.toBeInTheDocument();
  });

  it("keeps the normal ballot preview unchanged when not referendum", () => {
    render(<BallotPreview parties={[referendumParty]} />);

    expect(screen.getByText("Elige a tu candidato")).toBeInTheDocument();
    expect(screen.getByText("Selecciona al candidato de tu preferencia")).toBeInTheDocument();
    expect(screen.getByText("CONSULTA:")).toBeInTheDocument();
  });

  it("renders referendum parties as options without exposing the technical role", async () => {
    const user = userEvent.setup();
    render(<PartiesTable parties={[referendumParty]} isReferendum />);

    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("Opción")).toBeInTheDocument();
    await user.click(screen.getByText("Sí"));
    expect(screen.getByText("Alternativas asignadas")).toBeInTheDocument();
    expect(screen.getByText("Alternativa:")).toBeInTheDocument();
    expect(screen.queryByText("CONSULTA:")).not.toBeInTheDocument();
  });

  it("keeps referendum roles in read-only informational mode", () => {
    render(<ElectionConfigCargos />);

    expect(screen.getAllByText(/cargo técnico interno/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /agregar cargo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^editar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^eliminar$/i })).not.toBeInTheDocument();
    expect(screen.queryByText("CONSULTA")).not.toBeInTheDocument();
  });
});
