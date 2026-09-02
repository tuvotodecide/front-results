import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import ConfigStepsTabs from "@/features/electionConfig/components/ConfigStepsTabs";
import ConfigSummaryCard from "@/features/electionConfig/components/ConfigSummaryCard";
import { renderWithAuthStore, wizardAuthState } from "../utils/renderWithStore";

const createElectionMock = vi.fn();
const navigateMock = vi.fn();
const estimateCapacityMock = vi.fn();

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

vi.mock("@/store/tvd", () => ({
  useEstimateMyTvdCapacityMutation: () => [estimateCapacityMock, { isLoading: false }],
}));

// La tasa on-chain se mockea, pero el cálculo de costo (helpers puros) es el real.
vi.mock("@/features/adminTvd/data/useTvdPerCredit", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/adminTvd/data/useTvdPerCredit")
  >("@/features/adminTvd/data/useTvdPerCredit");
  return {
    ...actual,
    fetchTvdPerCredit: vi.fn().mockResolvedValue({
      raw: "1000000000000000000",
      decimals: 18,
      formatted: "1 TVD",
    }),
    useTvdPerCredit: () => ({
      tvdPerCredit: {
        raw: "1000000000000000000",
        decimals: 18,
        formatted: "1 TVD",
      },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    }),
  };
});

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

const MAX_OPEN_VOTERS_LABEL = "¿Cuántos votantes pueden participar?";
const OPEN_VOTING_SWITCH = "¿Es votación abierta?";

const TVD = (whole: number) => `${whole}${"0".repeat(18)}`;

const capacityResult = (overrides: Record<string, unknown> = {}) => ({
  unwrap: vi.fn().mockResolvedValue({
    estimatedParticipants: "250",
    tokensPerParticipant: "1",
    estimatedRequiredTokens: "250",
    availableTokens: "1000",
    availableSmallestUnit: TVD(1000),
    estimatedMissingTokens: "0",
    hasEstimatedCapacity: true,
    reasonCode: null,
    ...overrides,
  }),
});

const configSummary = (overrides: Record<string, unknown> = {}) => ({
  positionsOk: true,
  partiesOk: true,
  padronOk: true,
  positionsCount: 1,
  partiesCount: 2,
  votersCount: 250,
  enabledToVoteCount: 250,
  disabledToVoteCount: 0,
  ...overrides,
});

async function fillGeneralData(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText("¿A qué institución pertenece?"),
    "Elección abierta",
  );
  await user.type(
    screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
    "Elegir representantes institucionales",
  );
}

describe("EA2-01 | límite de votantes y costo en TVD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createElectionMock.mockResolvedValue({ id: "evt-open" });
    estimateCapacityMock.mockReturnValue(capacityResult());
  });

  it("EA2-01-001 activa el input de límite de votantes al encender la votación abierta", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    expect(screen.queryByLabelText(MAX_OPEN_VOTERS_LABEL)).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: OPEN_VOTING_SWITCH }));

    const input = screen.getByLabelText(MAX_OPEN_VOTERS_LABEL);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "1");

    await user.click(screen.getByRole("switch", { name: OPEN_VOTING_SWITCH }));

    expect(screen.queryByLabelText(MAX_OPEN_VOTERS_LABEL)).not.toBeInTheDocument();
  });

  it("EA2-01-002 solo admite enteros positivos como límite de votantes", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await user.click(screen.getByRole("switch", { name: OPEN_VOTING_SWITCH }));
    const input = screen.getByLabelText(MAX_OPEN_VOTERS_LABEL);

    fireEvent.change(input, { target: { value: "12.5" } });
    expect(input).toHaveValue(125);

    fireEvent.change(input, { target: { value: "-3" } });
    expect(input).toHaveValue(3);

    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("step", "1");
  });

  it("EA2-01-003 cotiza el límite de votantes contra el saldo TVD antes de avanzar", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await user.click(screen.getByRole("switch", { name: OPEN_VOTING_SWITCH }));
    await fillGeneralData(user);
    await user.type(screen.getByLabelText(MAX_OPEN_VOTERS_LABEL), "250");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(estimateCapacityMock).toHaveBeenCalledWith({
        estimatedParticipants: "250",
        tenantId: "tenant-1",
      });
    });
    expect(
      await screen.findByLabelText("¿Cuándo abre la votación?"),
    ).toBeInTheDocument();
  });

  it("EA2-01-004 bloquea el avance cuando el costo en TVD del límite supera el saldo disponible", async () => {
    const user = userEvent.setup();
    estimateCapacityMock.mockReturnValue(
      capacityResult({
        estimatedParticipants: "5000",
        estimatedRequiredTokens: "5000",
        availableTokens: "100",
        availableSmallestUnit: TVD(100),
        estimatedMissingTokens: "4900",
        hasEstimatedCapacity: false,
        reasonCode: "INSUFFICIENT_TVD_BALANCE",
      }),
    );
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await user.click(screen.getByRole("switch", { name: OPEN_VOTING_SWITCH }));
    await fillGeneralData(user);
    await user.type(screen.getByLabelText(MAX_OPEN_VOTERS_LABEL), "5000");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByText(
        "El límite de votantes cuesta 5000 TVD y solo tienes 100 TVD. Reduce el límite o recarga tokens.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("¿Cuándo abre la votación?"),
    ).not.toBeInTheDocument();
    expect(createElectionMock).not.toHaveBeenCalled();
  });

  it("EA2-01-005 no cotiza capacidad TVD cuando la votación no es abierta", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    await fillGeneralData(user);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByLabelText("¿Cuándo abre la votación?"),
    ).toBeInTheDocument();
    expect(estimateCapacityMock).not.toHaveBeenCalled();
  });
});

describe("EA2-02 | el padrón desaparece de la configuración abierta", () => {
  it("EA2-02-001 oculta el paso del padrón en una votación abierta", () => {
    render(<ConfigStepsTabs currentStep={1} isOpenVoting />);

    expect(screen.getByRole("button", { name: /1\. Cargos/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\. Planchas/ })).toBeInTheDocument();
    expect(screen.queryByText(/Padrón/)).not.toBeInTheDocument();
  });

  it("EA2-02-002 conserva el paso del padrón en una votación cerrada", () => {
    render(<ConfigStepsTabs currentStep={1} />);

    expect(screen.getByRole("button", { name: /3\. Padrón/ })).toBeInTheDocument();
  });

  it("EA2-02-003 oculta el paso del padrón también en un referéndum abierto", () => {
    render(<ConfigStepsTabs currentStep={2} isReferendum isOpenVoting />);

    expect(screen.getByRole("button", { name: /1\. Opciones/ })).toBeInTheDocument();
    expect(screen.queryByText(/Padrón/)).not.toBeInTheDocument();
  });
});

describe("EA2-03 | revisión de datos de una votación abierta", () => {
  it("EA2-03-001 muestra la etiqueta de votación abierta, el límite y el costo en TVD", () => {
    render(
      <ConfigSummaryCard
        summary={configSummary()}
        isOpenVoting
        maxOpenVoters={250}
      />,
    );

    expect(screen.getByText("Votación abierta")).toBeInTheDocument();
    expect(screen.getByText("Límite de votantes")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("Costo en TVD")).toBeInTheDocument();
    expect(screen.getByText("250 TVD")).toBeInTheDocument();
    expect(screen.queryByText("Padrón listo")).not.toBeInTheDocument();
  });

  it("EA2-03-002 mantiene el estado del padrón en la revisión de una votación cerrada", () => {
    render(<ConfigSummaryCard summary={configSummary()} />);

    expect(screen.getByText("Padrón listo")).toBeInTheDocument();
    expect(screen.queryByText("Votación abierta")).not.toBeInTheDocument();
    expect(screen.queryByText("Costo en TVD")).not.toBeInTheDocument();
  });
});
