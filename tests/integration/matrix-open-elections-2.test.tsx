import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import {
  renderStatusPage,
  resetStatusMocks,
  statusMocks,
} from "./helpers/electionStatusTestUtils";

const publicElectionRepositoryMock = vi.hoisted(() => ({
  getPublicElectionDetail: vi.fn(),
  listPublicElections: vi.fn(),
}));

vi.mock("@/features/publicElectionDetail/data/PublicElectionRepository.api", () => ({
  publicElectionRepository: publicElectionRepositoryMock,
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ electionId: "evt-open" }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ electionId: "evt-open" }),
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

const publicElection = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-open",
  title: "Elección Directorio 2026",
  subtitle: "Asoblockchain",
  isReferendum: false,
  isOpenVoting: true,
  status: "LIVE",
  schedule: {
    from: "10 de julio de 2026 - 08:00 hrs",
    to: "10 de julio de 2026 - 18:00 hrs",
  },
  results: null,
  winnerCandidateId: null,
  publicEligibilityEnabled: true,
  ballotParties: [],
  ...overrides,
});

describe("EA2-05 | detalle administrativo de una votación abierta", () => {
  beforeEach(() => {
    resetStatusMocks();
  });

  it("EA2-05-001 muestra la etiqueta de votación abierta, el límite y el costo en TVD", async () => {
    statusMocks.event = {
      ...statusMocks.event,
      isOpenVoting: true,
      maxOpenVoters: 250,
    };

    renderStatusPage();

    expect(await screen.findByText("Votación abierta")).toBeInTheDocument();
    expect(screen.getByText("Límite de votantes")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("Costo en TVD")).toBeInTheDocument();
    expect(screen.getByText("250 TVD")).toBeInTheDocument();
  });

  it("EA2-05-002 no muestra el bloque de votación abierta en una votación cerrada", () => {
    statusMocks.event = {
      ...statusMocks.event,
      isOpenVoting: false,
      maxOpenVoters: 0,
    };

    renderStatusPage();

    expect(screen.queryByText("Votación abierta")).not.toBeInTheDocument();
    expect(screen.queryByText("Límite de votantes")).not.toBeInTheDocument();
    expect(screen.queryByText("Costo en TVD")).not.toBeInTheDocument();
  });
});

describe("EA2-07 | consulta pública de padrón en una votación abierta", () => {
  afterEach(() => {
    publicElectionRepositoryMock.getPublicElectionDetail.mockReset();
    publicElectionRepositoryMock.listPublicElections.mockReset();
  });

  it("EA2-07-001 no ofrece consultar el estado del padrón en una votación abierta", async () => {
    publicElectionRepositoryMock.getPublicElectionDetail.mockResolvedValue(
      publicElection(),
    );

    render(<PublicElectionDetailPage />);

    expect(
      await screen.findByText("Elección Directorio 2026"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Consultar mi estado" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /consulta si estás habilitado/i }),
    ).not.toBeInTheDocument();
  });

  it("EA2-07-002 mantiene la consulta de padrón en una votación cerrada", async () => {
    publicElectionRepositoryMock.getPublicElectionDetail.mockResolvedValue(
      publicElection({ isOpenVoting: false }),
    );

    render(<PublicElectionDetailPage />);

    expect(
      await screen.findByRole("button", { name: "Consultar mi estado" }),
    ).toBeInTheDocument();
  });

  it("EA2-07-003 marca la votación como abierta en la cabecera pública", async () => {
    publicElectionRepositoryMock.getPublicElectionDetail.mockResolvedValue(
      publicElection(),
    );

    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("Votación abierta")).toBeInTheDocument();
  });
});
