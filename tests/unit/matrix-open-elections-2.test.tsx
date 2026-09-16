import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import ConfigStepsTabs from "@/features/electionConfig/components/ConfigStepsTabs";
import ConfigSummaryCard from "@/features/electionConfig/components/ConfigSummaryCard";
import { renderWithAuthStore, wizardAuthState } from "../utils/renderWithStore";

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

// La tasa on-chain se mockea, pero el cálculo de costo (helpers puros) es el real.
vi.mock("@/features/adminTvd/data/useTvdPerCredit", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/adminTvd/data/useTvdPerCredit")
  >("@/features/adminTvd/data/useTvdPerCredit");
  return {
    ...actual,
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

describe("EA2-01 | límite de votantes y costo en TVD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createElectionMock.mockResolvedValue({ id: "evt-open" });
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
        tvdCapacityOk
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
    render(<ConfigSummaryCard summary={configSummary()} tvdCapacityOk />);

    expect(screen.getByText("Padrón listo")).toBeInTheDocument();
    expect(screen.queryByText("Votación abierta")).not.toBeInTheDocument();
    expect(screen.queryByText("Costo en TVD")).not.toBeInTheDocument();
  });

  it("EA2-03-003 marca la capacidad TVD y queda listo para publicar cuando todo está completo", () => {
    render(<ConfigSummaryCard summary={configSummary()} tvdCapacityOk />);

    const capacityLabel = screen.getByText("Capacidad TVD suficiente");
    expect(capacityLabel).toHaveClass("text-gray-700");
    expect(screen.getByText("Listo para publicar")).toBeInTheDocument();
    expect(screen.queryByText("Configuración incompleta")).not.toBeInTheDocument();
  });

  it("EA2-03-004 no queda listo para publicar sin capacidad TVD suficiente", () => {
    render(<ConfigSummaryCard summary={configSummary()} tvdCapacityOk={false} />);

    const capacityLabel = screen.getByText("Capacidad TVD suficiente");
    expect(capacityLabel).toHaveClass("text-gray-400");
    expect(screen.getByText("Configuración incompleta")).toBeInTheDocument();
    expect(screen.queryByText("Listo para publicar")).not.toBeInTheDocument();
  });
});
