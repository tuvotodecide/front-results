import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ElectionsPage from "@/features/elections/ElectionsPage";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import WalletMigrationNotice from "@/features/elections/components/WalletMigrationNotice";
import type { InstitutionalWalletMigrationGateResponse } from "@/store/institutionalWalletMigration";
import { renderWithAuthStore, wizardAuthState } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const refetchGateMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventsQuery: vi.fn(),
  useDisableVotingEventMutation: vi.fn(),
}));

vi.mock("@/store/tvd", () => ({
  useGetMyTvdSummaryQuery: vi.fn(),
  useEstimateMyTvdCapacityMutation: vi.fn(),
}));

vi.mock("@/store/institutionalWalletMigration", () => ({
  useGetInstitutionalWalletMigrationGateQuery: vi.fn(),
}));

vi.mock("@/features/elections/data/useElectionRepository", () => ({
  useCreateElection: () => ({ createElection: vi.fn(), creating: false }),
}));

import * as votingEvents from "@/store/votingEvents";
import * as tvdStore from "@/store/tvd";
import * as walletMigrationStore from "@/store/institutionalWalletMigration";

const mockGate = (data: Partial<InstitutionalWalletMigrationGateResponse> | undefined) => {
  vi.mocked(walletMigrationStore.useGetInstitutionalWalletMigrationGateQuery).mockReturnValue({
    data: data
      ? {
          tenantId: "tenant-1",
          blocking: false,
          reason: "NONE",
          status: null,
          institutionalRole: "PRIMARY",
          message: null,
          ...data,
        }
      : undefined,
    isFetching: false,
    refetch: refetchGateMock,
  } as any);
};

const renderDashboard = () => {
  vi.mocked(votingEvents.useGetVotingEventsQuery).mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as any);
  vi.mocked(votingEvents.useDisableVotingEventMutation).mockReturnValue([vi.fn(), { isLoading: false }] as any);
  vi.mocked(tvdStore.useGetMyTvdSummaryQuery).mockReturnValue({
    data: { walletStatus: "VERIFIED", wallet: "0x2222222222222222222222222222222222222222" },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  } as any);
  vi.mocked(tvdStore.useEstimateMyTvdCapacityMutation).mockReturnValue([
    vi.fn(() => ({ unwrap: () => Promise.resolve({ hasEstimatedCapacity: true }) })),
    { isLoading: false, error: null },
  ] as any);
  return renderWithAuthStore(<ElectionsPage />, wizardAuthState);
};

describe("Migración de billetera institucional | bloqueo de creación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta el estado de la institución activa al montar", () => {
    mockGate({ blocking: false });
    renderDashboard();

    expect(walletMigrationStore.useGetInstitutionalWalletMigrationGateQuery).toHaveBeenCalledWith(
      { tenantId: "tenant-1" },
      expect.objectContaining({ skip: false, refetchOnMountOrArgChange: true }),
    );
  });

  it("muestra el aviso y deshabilita la creación si aún no se encuentra la nueva billetera", async () => {
    const user = userEvent.setup();
    mockGate({ blocking: true, reason: "WALLET_NOT_FOUND", status: "AWAITING_WALLET" });
    renderDashboard();

    expect(screen.getByTestId("wallet-migration-notice")).toHaveTextContent(
      "No encontramos tu nueva billetera",
    );
    const createButton = screen.getByRole("button", { name: "Crear votación" });
    const newButton = screen.getByRole("button", { name: "Nueva Votación" });
    expect(createButton).toBeDisabled();
    expect(newButton).toBeDisabled();

    await user.click(createButton);
    expect(screen.queryByRole("dialog", { name: "Estimar participantes" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Volver a verificar" }));
    expect(refetchGateMock).toHaveBeenCalledTimes(1);
  });

  it("muestra el aviso mientras la migración on-chain está en curso", () => {
    mockGate({ blocking: true, reason: "IN_PROGRESS", status: "READY" });
    renderDashboard();

    expect(screen.getByTestId("wallet-migration-notice")).toHaveTextContent(
      "Estamos actualizando la billetera de la institución",
    );
    expect(screen.getByRole("button", { name: "Nueva Votación" })).toBeDisabled();
  });

  it("permite crear cuando la migración terminó", async () => {
    const user = userEvent.setup();
    mockGate({ blocking: false, reason: "NONE", status: "CONFIRMED" });
    renderDashboard();

    expect(screen.queryByTestId("wallet-migration-notice")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear votación" }));
    expect(screen.getByRole("dialog", { name: "Estimar participantes" })).toBeInTheDocument();
  });

  it("no bloquea si el estado no pudo consultarse", () => {
    mockGate(undefined);
    renderDashboard();

    expect(screen.queryByTestId("wallet-migration-notice")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva Votación" })).toBeEnabled();
  });

  it("bloquea también el asistente si se entra directo por URL", () => {
    mockGate({ blocking: true, reason: "PRIMARY_LOGIN_PENDING" });
    renderWithAuthStore(<CreateElectionWizard />, wizardAuthState);

    expect(screen.getByTestId("wallet-migration-notice")).toHaveTextContent(
      "La administración principal debe iniciar sesión",
    );
  });

  it.each([
    ["NEEDS_REVIEW", "PRIMARY", "requiere revisión"],
    ["SECONDARY_REAUTHORIZATION_REQUIRED", "SECONDARY", "Tu acceso necesita volver a autorizarse"],
    ["WALLET_NOT_FOUND", "SECONDARY", "todavía no registró su nueva billetera"],
  ] as const)("muestra el texto de %s para rol %s", (reason, institutionalRole, expected) => {
    renderWithAuthStore(
      <WalletMigrationNotice
        gate={{ blocking: true, reason, institutionalRole, isChecking: false, recheck: vi.fn() }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(expected);
  });
});
