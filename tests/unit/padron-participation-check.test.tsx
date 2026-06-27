import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import PadronCheckModal from "@/features/padronCheck/PadronCheckModal";
import { PadronCheckServiceApi } from "@/features/padronCheck/PadronCheckService.api";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import LegacyPublicElectionDetailPage from "@/features/publicElectionDetail/PublicElectionDetailPage";

const publicElectionRepositoryMock = vi.hoisted(() => ({
  getPublicElectionDetail: vi.fn(),
  listPublicElections: vi.fn(),
}));

vi.mock("@/features/publicElectionDetail/data/PublicElectionRepository.api", () => ({
  publicElectionRepository: publicElectionRepositoryMock,
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ electionId: "evt-1" }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ electionId: "evt-1" }),
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
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

vi.mock("../../src/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

const fetchMock = vi.fn();
const forbiddenTexts = [
  "CI habilitado",
  "CI no habilitado",
  "No está en padrón",
  "ALREADY_VOTED",
  "CAN_VOTE",
  "NOT_ELIGIBLE",
  "participated: true",
  "status",
  "carnetNorm",
  "DID",
  "participatedAt",
];

const publicElection = {
  id: "evt-1",
  title: "Elección Directorio 2026",
  subtitle: "Asoblockchain",
  isReferendum: false,
  status: "FINISHED",
  schedule: {
    from: "10 de julio de 2026 - 08:00 hrs",
    to: "10 de julio de 2026 - 18:00 hrs",
  },
  results: null,
  winnerCandidateId: null,
  publicEligibilityEnabled: true,
  ballotParties: [],
} as const;

describe("participation check", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
    publicElectionRepositoryMock.getPublicElectionDetail.mockReset();
    publicElectionRepositoryMock.listPublicElections.mockReset();
  });

  it("consulta el endpoint público mínimo de participación por evento", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        eventId: "evt-1",
        participated: true,
        carnet: "1234567",
        eligible: true,
        status: "ALREADY_VOTED",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new PadronCheckServiceApi();
    const result = await service.checkParticipation("123 4567", "evt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/voting/events/evt-1/participation/check-public?carnet=123%204567"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
    expect(result).toEqual({
      kind: "participation",
      participated: true,
    });
  });

  it("muestra Ya votó cuando la API confirma participación", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ eventId: "evt-1", participated: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PadronCheckModal
        isOpen
        onClose={vi.fn()}
        eventId="evt-1"
        mode="participation"
      />,
    );

    fireEvent.change(screen.getByLabelText("CI"), {
      target: { value: "1234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByText("Ya votó")).toBeInTheDocument();
    expect(screen.queryByText("No votó")).not.toBeInTheDocument();
    forbiddenTexts.forEach((text) => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });
  });

  it("muestra solo No votó en modo participación cuando no hay registro", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ eventId: "evt-1", participated: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PadronCheckModal
        isOpen
        onClose={vi.fn()}
        eventId="evt-1"
        mode="participation"
      />,
    );

    expect(screen.getByRole("dialog", { name: "Verificar participación" })).toBeInTheDocument();
    expect(
      screen.getByText("Ingresa el CI para consultar si ya votó en esta elección."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("CI"), {
      target: { value: "1234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByText("No votó")).toBeInTheDocument();
    expect(screen.queryByText("CI habilitado")).not.toBeInTheDocument();
    expect(screen.queryByText("CI no habilitado")).not.toBeInTheDocument();
    expect(screen.queryByText("HABILITADO")).not.toBeInTheDocument();
    expect(screen.queryByText("NO HABILITADO")).not.toBeInTheDocument();
    expect(screen.queryByText("ALREADY_VOTED")).not.toBeInTheDocument();
    forbiddenTexts.forEach((text) => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("muestra carga y error simple al verificar participación", async () => {
    let rejectRequest!: () => void;
    fetchMock.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = () => reject(new Error("network"));
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PadronCheckModal
        isOpen
        onClose={vi.fn()}
        eventId="evt-1"
        mode="participation"
      />,
    );

    fireEvent.change(screen.getByLabelText("CI"), {
      target: { value: "1234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verificar/i }));

    expect(screen.getByText("Verificando...")).toBeInTheDocument();

    rejectRequest();

    expect(
      await screen.findByText("No se pudo verificar el CI. Intenta nuevamente."),
    ).toBeInTheDocument();
    forbiddenTexts.forEach((text) => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });
  });

  it("renderiza la card en la vista pública actual y abre el modal", async () => {
    publicElectionRepositoryMock.getPublicElectionDetail.mockResolvedValue(publicElection);

    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("Verificar participación")).toBeInTheDocument();
    expect(screen.getByText("Horario de Votación")).toBeInTheDocument();
    expect(screen.getByText("Estado Actual")).toBeInTheDocument();
    expect(
      screen.getByText("Consulta si un CI ya votó en esta elección."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Verificar CI" }));

    expect(
      screen.getByText("Ingresa el CI para consultar si ya votó en esta elección."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CI")).toBeInTheDocument();
  });

  it("renderiza la card en la vista pública heredada y abre el modal", async () => {
    publicElectionRepositoryMock.getPublicElectionDetail.mockResolvedValue(publicElection);

    render(<LegacyPublicElectionDetailPage />);

    expect(await screen.findByText("Verificar participación")).toBeInTheDocument();
    expect(screen.getByText("Horario de Votación")).toBeInTheDocument();
    expect(screen.getByText("Estado Actual")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Verificar CI" }));

    expect(
      screen.getByText("Ingresa el CI para consultar si ya votó en esta elección."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CI")).toBeInTheDocument();
  });
});
