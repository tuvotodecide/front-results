import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { vi } from "vitest";
import SuperadminHomePage from "@/domains/superadmin/screens/SuperadminHomePage";
import InstitutionalRecoveryPublicPage from "@/domains/auth-votacion/screens/InstitutionalRecoveryPublicPage";
import InstitutionalRecoveryAdminPage from "@/domains/superadmin/screens/InstitutionalRecoveryAdminPage";
import TvdAssignmentPage from "@/domains/superadmin/screens/TvdAssignmentPage";
import TvdContractPage from "@/domains/superadmin/screens/TvdContractPage";
import TvdOperationsPage from "@/domains/superadmin/screens/TvdOperationsPage";
import TvdParametersPage from "@/domains/superadmin/screens/TvdParametersPage";
import TvdWalletLookupPage from "@/domains/superadmin/screens/TvdWalletLookupPage";
import { mockAssignmentTxHash } from "@/domains/superadmin/data/superadminTvd.mock";
import * as clipboardService from "@/domains/superadmin/services/clipboard";
import { renderWithAuthStore } from "../utils/renderWithStore";

vi.mock("@/domains/superadmin/hooks/useSuperadminTvdReadModel", () => ({
  useTvdContractsReadModel: () => ({
    data: tvdContractReadModel,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
  useTvdParametersReadModel: () => ({
    data: tvdParametersReadModel,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock("@/store/tvd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/tvd")>();
  const operations = Array.from({ length: 8 }, (_, index) => ({
    id: `operation-${index + 1}`,
    tenantId: index < 3 ? "tse" : "other",
    institutionName: index < 3 ? "Tribunal Supremo Electoral" : "Municipio de La Paz",
    operationType: index === 0 ? "VOTE_CONSUMPTION" : "MANUAL_ASSIGNMENT",
    operationLabel: index === 0 ? "Consumo por voto" : "Asignación manual",
    economicDirection: index === 0 ? "OUT" : "IN",
    status: "CONFIRMED",
    statusLabel: "Confirmada",
    amount: index === 0 ? "1" : "100",
    amountSmallestUnit: "1",
    txHash: index === 0 ? "0xjkl4567890abcdef4" : `0xoperation${index}abcdef`,
    date: index === 0 ? "2026-06-26T12:00:00.000Z" : "2026-06-25T12:00:00.000Z",
    explorerUrl: `https://basescan.org/tx/${index}`,
    source: "HISTORY",
  }));
  const filteredOperations = (filters: { tenantId?: string; operationType?: string; dateFrom?: string }) => {
    if (filters.tenantId === "tse") return operations.slice(0, 3);
    if (filters.operationType === "VOTE_CONSUMPTION" || filters.dateFrom) return operations.slice(0, 1);
    return operations;
  };
  return {
    ...actual,
    allInstitutionsOptionLabel: "Todas las instituciones",
    tvdAdminOperationTypes: ["MANUAL_ASSIGNMENT", "QR_RECHARGE", "VOTE_CONSUMPTION"],
    tvdAdminOperationLabels: {
      MANUAL_ASSIGNMENT: "Asignación manual",
      QR_RECHARGE: "Recarga mediante QR",
      VOTE_CONSUMPTION: "Consumo por voto",
    },
    tvdAdminOperationStatuses: ["PENDING", "PROCESSING", "CONFIRMED"],
    tvdAdminOperationStatusLabels: { PENDING: "Pendiente", PROCESSING: "En proceso", CONFIRMED: "Confirmada" },
    useListTvdAdminInstitutionsQuery: () => ({
      data: { items: [{ tenantId: "tse", name: "Tribunal Supremo Electoral" }] },
      isLoading: false,
      isError: false,
    }),
    useListTvdAdminOperationsQuery: (filters: { tenantId?: string; operationType?: string; dateFrom?: string }) => {
      const items = filteredOperations(filters);
      return {
        data: { items, total: 8, hasNextPage: false, summary: { totalOperations: items.length, totalAssigned: filters.tenantId === "tse" ? "300" : "700", totalConsumed: "1" } },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    },
    useGetCurrentTvdExchangeRateQuery: () => ({ data: { bobPerToken: "1" }, error: null, isFetching: false, refetch: vi.fn() }),
    useCreateTvdExchangeRateMutation: () => [vi.fn(), { isLoading: false }],
  };
});

const recoveryRequests = [
  {
    requestId: "pending-request",
    requestType: "ADMIN_EMAIL_CHANGE",
    tenantId: "tse",
    institutionName: "Tribunal Supremo Electoral",
    fullName: "Ana Gómez",
    phoneNumber: null,
    newEmail: "ana.gomez@tse.gob.bo",
    supervisorPhoneNumber: null,
    status: "PENDING",
    requestedAt: "2026-07-23T12:00:00.000Z",
    resolvedAt: null,
  },
  {
    requestId: "approved-request",
    requestType: "ADMIN_EMAIL_CHANGE",
    tenantId: "lapaz",
    institutionName: "Municipio de La Paz",
    fullName: "María Pérez",
    phoneNumber: null,
    newEmail: "maria@lapaz.bo",
    supervisorPhoneNumber: null,
    status: "APPROVED",
    requestedAt: "2026-07-22T12:00:00.000Z",
    resolvedAt: "2026-07-23T12:00:00.000Z",
  },
];

vi.mock("@/store/institutionalRecovery", () => ({
  useListInstitutionalRecoveryRequestsQuery: (query?: { status?: string }) => ({
    data: { data: query?.status ? recoveryRequests.filter((request) => request.status === query.status) : recoveryRequests, total: query?.status ? 1 : recoveryRequests.length },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
  }),
  useGetInstitutionalRecoveryRequestQuery: (requestId: string) => ({
    data: requestId ? { ...recoveryRequests.find((request) => request.requestId === requestId), candidateUserId: "user-1", candidateAssignmentId: "assignment-1", currentEmail: "old@tse.gob.bo", accountAddress: null, institutionalRole: "TENANT_ADMIN", warnings: [], resolutionReason: null } : undefined,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApproveInstitutionalRecoveryRequestMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }],
  useApproveAdminEmailChangeRequestMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }],
  useRejectInstitutionalRecoveryRequestMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({}) })), { isLoading: false }],
  useCreateInstitutionalRecoveryRequestMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve({ requestId: "new-request", status: "PENDING", requestedAt: "2026-07-23T12:00:00.000Z" }) })), { isLoading: false }],
}));

vi.mock("@/store/institutionalTenants", () => ({
  useLazyListPublicInstitutionalTenantsQuery: () => [
    vi.fn(() => ({ unwrap: () => Promise.resolve({ items: [{ institutionId: "507f1f77bcf86cd799439011", institutionName: "Tribunal Supremo Electoral" }] }) })),
  ],
}));

const tvdContractReadModel = {
  status: "available",
  network: {
    chainId: 84532,
    name: "Base Sepolia",
    explorerBaseUrl: "https://sepolia.basescan.org",
  },
  tvdToken: {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    explorerUrl:
      "https://sepolia.basescan.org/address/0x1234567890abcdef1234567890abcdef12345678",
    txExplorerUrl:
      "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    status: "available",
    deploymentDate: {
      status: "available",
      isoDate: "2026-07-23T12:00:00.000Z",
      message: null,
    },
  },
  multisig: {
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    txHash: null,
    explorerUrl:
      "https://sepolia.basescan.org/address/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    txExplorerUrl: null,
    status: "available",
    required: "2",
    ownersCount: 3,
    thresholdLabel: "2 de 3 firmantes",
    owners: [
      {
        address: "0x1111111111111111111111111111111111111111",
        explorerUrl:
          "https://sepolia.basescan.org/address/0x1111111111111111111111111111111111111111",
      },
    ],
    warning: null,
    readStatus: "available",
    errorMessage: null,
  },
  officialWallets: [
    {
      id: "treasury",
      name: "Tesorería multisig",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      explorerUrl:
        "https://sepolia.basescan.org/address/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      status: "available",
      configKey: "TVD_TREASURY_WALLET",
      initialDistribution: {
        txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        txExplorerUrl:
          "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        amount: "1000 $TVD",
        status: "available",
        message: null,
      },
      currentDistribution: {
        amount: "900 $TVD",
        status: "available",
        message: null,
      },
    },
  ],
  updatedAt: "2026-07-23T12:30:00.000Z",
  issues: [],
};

const renderAsSuperadmin = (ui: ReactElement) =>
  renderWithAuthStore(ui, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
  });

const tvdParametersReadModel = {
  status: "available",
  network: {
    chainId: 8453,
    name: "Base",
    explorerBaseUrl: "https://basescan.org",
  },
  decimals: 18,
  tvdPerCredit: {
    raw: "1000000000000000000",
    formatted: "1 TVD",
    status: "available",
    message: null,
  },
  burn: {
    raw: "1000",
    formatted: "10%",
    status: "available",
    message: null,
    burnBps: "1000",
    burnPercentage: "10%",
  },
  rewardByVote: {
    raw: "0",
    formatted: "0 TVD",
    status: "available",
    message: null,
    enabled: false,
  },
  campaign: {
    status: "available",
    message: "No existe una campaña configurada",
    count: "0",
    fields: [],
  },
  contracts: {
    tvdToken: {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      txHash: null,
      explorerUrl:
        "https://basescan.org/address/0x1234567890abcdef1234567890abcdef12345678",
      txExplorerUrl: null,
      status: "available",
    },
    electoralCredits: {
      address: "0x4444444444444444444444444444444444444444",
      txHash: null,
      explorerUrl: "https://basescan.org/address/0x4444444444444444444444444444444444444444",
      txExplorerUrl: null,
      status: "available",
    },
    voteManager: {
      address: "0x5555555555555555555555555555555555555555",
      txHash: null,
      explorerUrl: "https://basescan.org/address/0x5555555555555555555555555555555555555555",
      txExplorerUrl: null,
      status: "available",
    },
    incentiveCampaigns: {
      address: "0x6666666666666666666666666666666666666666",
      txHash: null,
      explorerUrl: "https://basescan.org/address/0x6666666666666666666666666666666666666666",
      txExplorerUrl: null,
      status: "available",
    },
  },
  updatedAt: "2026-07-23T12:30:00.000Z",
  issues: [],
};

describe("pantallas Superadmin", () => {
  beforeEach(() => {
    vi.spyOn(clipboardService, "copyTextToClipboard").mockResolvedValue(
      true,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renderiza panel principal con las 7 cards y links", () => {
    render(<SuperadminHomePage />);

    expect(screen.getByRole("heading", { name: "Panel Superadmin" })).toBeInTheDocument();
    const expectedLinks = [
      ["/superadmin/tvd/contrato", /Contrato \$TVD/i],
      ["/superadmin/tvd/parametros", /Parámetros económicos/i],
      ["/superadmin/tvd/asignacion", /Asignación manual/i],
      ["/superadmin/tvd/operaciones", /Operaciones \$TVD/i],
      ["/superadmin/tvd/consulta-billetera", /Consulta billetera/i],
      ["/superadmin/gestion/registros", /Gestión de registros/i],
      ["/superadmin/gestion/recuperacion", /Recuperación institucional/i],
    ] as const;

    expectedLinks.forEach(([href, name]) => {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    });
  });

  it("renderiza contrato $TVD con red, txHash, firmantes y fondos", async () => {
    renderAsSuperadmin(<TvdContractPage />);

    expect(await screen.findByText(/Base Sepolia/)).toBeInTheDocument();
    expect(screen.getByText("0x1234...5678")).toBeInTheDocument();
    expect(screen.getByText("0xaaaa...aaaa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrato multisig" })).toBeInTheDocument();
    expect(screen.getByText("Tesorería multisig")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ver en BaseScan/i }).length).toBeGreaterThan(1);
  });

  it("abre y cierra modal informativo de parámetros económicos", async () => {
    const user = userEvent.setup();
    renderAsSuperadmin(<TvdParametersPage />);

    expect(await screen.findByText("Consumo por voto válido")).toBeInTheDocument();
    expect(screen.getByText("Porcentaje de quema")).toBeInTheDocument();
    expect(screen.getByText("Recompensa por voto válido")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    expect(
      screen.getByRole("dialog", {
        name: "Consumo por voto válido",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Este cambio se realiza desde el contrato/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abrir en blockchain/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("valida y completa el wizard de asignación manual", async () => {
    const user = userEvent.setup();
    render(<TvdAssignmentPage />);

    expect(screen.getByText("Tribunal Supremo Electoral")).toBeInTheDocument();
    expect(screen.getByText("Universidad Mayor de San Andrés")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscar institución"), "Universidad");
    expect(screen.queryByText("Municipio de La Paz")).not.toBeInTheDocument();

    await user.click(screen.getByText("Universidad Mayor de San Andrés"));
    expect(
      screen.getByText("Solo se puede continuar con instituciones validadas."),
    ).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Buscar institución"));
    await user.click(screen.getByText("Tribunal Supremo Electoral"));

    expect(screen.getByText("2. Datos de asignación")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Revisar y firmar/i }));
    expect(screen.getByText("Ingresa un monto numérico mayor a 0.")).toBeInTheDocument();
    expect(
      screen.getByText("Describe la razón auditada de la asignación."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Monto en \$TVD/i), "1000");
    await user.type(
      screen.getByLabelText(/Debe describir la razón porque esto está auditado/i),
      "Regalo para prueba piloto de votación",
    );
    await user.click(screen.getByRole("button", { name: /Revisar y firmar/i }));

    expect(screen.getByText("Resumen de operación")).toBeInTheDocument();
    expect(screen.getByText("Ecosistema y Votantes / Vota y Gana")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Firmar con MetaMask/i }));
    expect(screen.getByText("Confirmar operación en MetaMask")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Transacción confirmada")).toBeInTheDocument();
    });
    expect(screen.getByText(mockAssignmentTxHash)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Copiar txHash/i }));
    await waitFor(() => {
      expect(clipboardService.copyTextToClipboard).toHaveBeenCalledWith(
        mockAssignmentTxHash,
      );
    });

    await user.click(screen.getByRole("button", { name: /Nueva asignación/i }));
    expect(screen.getByText("1. Seleccionar institución")).toBeInTheDocument();
  });

  it("filtra operaciones $TVD y muestra resumen por institución", async () => {
    const user = userEvent.setup();
    renderAsSuperadmin(<TvdOperationsPage />);

    expect(screen.getByRole("heading", { name: "Operaciones $TVD" })).toBeInTheDocument();
    expect(screen.getAllByText(/8 operaciones de 8/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tx Hash").length).toBeGreaterThan(0);

    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      "Tribunal Supremo Electoral",
    );

    expect(screen.getByText("Cantidad de operaciones")).toBeInTheDocument();
    expect(screen.getByText("300 $TVD")).toBeInTheDocument();
    expect(screen.getAllByText("1 $TVD").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3 operaciones de 8/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Comprobar operación/i }).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("filtra operaciones por tipo y rango de fechas, y permite copiar txHash", async () => {
    const user = userEvent.setup();
    renderAsSuperadmin(<TvdOperationsPage />);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "VOTE_CONSUMPTION");

    expect(screen.getAllByText("Consumo por voto").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 operaciones de 8/).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "");
    await user.type(screen.getAllByPlaceholderText("dd/mm/aaaa")[0], "26/06/2026");
    await user.type(screen.getAllByPlaceholderText("dd/mm/aaaa")[1], "26/06/2026");

    expect(screen.getAllByText(/26.*jun.*2026/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 operaciones de 8/).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /Copiar/i })[0]);

    await waitFor(() => {
      expect(clipboardService.copyTextToClipboard).toHaveBeenCalledWith(
        "0xjkl4567890abcdef4",
      );
    });
  });

  it("consulta una billetera real mediante Backend Results y no muestra saldo", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accountAddress: "0x1234567890AbcdEF1234567890aBcdef12345678",
          registeredInIdentity: true,
          identityStatus: "REGISTERED",
          associationStatus: "ASSOCIATED",
          canUse: true,
          reasonCode: "WALLET_ASSOCIATED",
          associations: [
            {
              tenantId: "tenant-1",
              tenantName: "Tribunal Supremo Electoral",
              tenantActive: true,
              assignmentId: "assignment-1",
              userId: "user-1",
              institutionalRole: "TENANT_ADMIN",
              assignmentStatus: "APPROVED",
              assignmentActive: true,
              userActive: true,
              walletStatus: "VERIFIED",
              walletVerifiedAt: "2026-07-21T10:00:00.000Z",
              walletVerificationSource: "IDENTITY",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithAuthStore(<TvdWalletLookupPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
      user: {
        id: "superadmin-1",
        email: "superadmin@test.dev",
        name: "Superadmin",
        role: "SUPERADMIN",
        active: true,
      },
    });

    expect(
      screen.getByText(/Ingresa una dirección de wallet para consultar el detalle/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    expect(await screen.findByText("Detalle de billetera")).toBeInTheDocument();
    expect(screen.getAllByText("Sí pertenece").length).toBeGreaterThan(0);
    expect(screen.queryByText("100 $TVD")).not.toBeInTheDocument();
  });

  it("valida input vacío y permite copiar la wallet consultada", async () => {
    const user = userEvent.setup();
    const normalizedAddress = "0x1234567890AbcdEF1234567890aBcdef12345678";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accountAddress: normalizedAddress,
            registeredInIdentity: false,
            identityStatus: "NOT_REGISTERED",
            associationStatus: "UNASSOCIATED",
            canUse: false,
            reasonCode: "WALLET_NOT_REGISTERED",
            associations: [],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    renderWithAuthStore(<TvdWalletLookupPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
      user: {
        id: "superadmin-1",
        email: "superadmin@test.dev",
        name: "Superadmin",
        role: "SUPERADMIN",
        active: true,
      },
    });

    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect(screen.queryByText("Detalle de billetera")).not.toBeInTheDocument();
    expect(
      screen.getByText("Ingresa una dirección de wallet."),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234567890abcdef1234567890abcdef12345678",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect((await screen.findAllByText("No pertenece")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /Copiar/i }));

    await waitFor(() => {
      expect(clipboardService.copyTextToClipboard).toHaveBeenCalledWith(
        normalizedAddress,
      );
    });
  });

  it("aprueba una solicitud de recuperación institucional y muestra toast", async () => {
    const user = userEvent.setup();
    renderAsSuperadmin(<InstitutionalRecoveryAdminPage />);

    expect(
      screen.getByRole("heading", { name: "Cambio de correo institucional" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Ana Gómez").length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    expect(
      screen.getByRole("dialog", { name: /Detalle de cambio de correo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("old@tse.gob.bo").length,
    ).toBeGreaterThan(0);

    await user.type(
      screen.getByPlaceholderText(/Indica una nota administrativa segura/i),
      "Identidad verificada localmente",
    );
    await user.click(screen.getByRole("button", { name: /Aprobar cambio/i }));
    expect(screen.getByRole("dialog", { name: /¿Aprobar cambio de correo/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Aprobar cambio/i })[1]);

    await waitFor(() => {
      expect(screen.getByText("Operación completada")).toBeInTheDocument();
    });
    expect(screen.getByText("Cambio de correo aprobado.")).toBeInTheDocument();
  });

  it("filtra recuperación institucional por estado, bloquea acciones no pendientes y permite rechazar pendientes", async () => {
    const user = userEvent.setup();
    renderAsSuperadmin(<InstitutionalRecoveryAdminPage />);

    await user.selectOptions(screen.getByRole("combobox"), "Aprobada");

    expect(screen.getAllByText("Municipio de La Paz").length).toBeGreaterThan(0);
    expect(screen.queryByText("Tribunal Supremo Electoral")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    expect(screen.getByRole("button", { name: /^Aprobar cambio$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Rechazar$/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    await user.selectOptions(screen.getByRole("combobox"), "ALL");
    await user.clear(screen.getByPlaceholderText("Buscar institución, administrador o correo"));
    await user.type(screen.getByPlaceholderText("Buscar institución, administrador o correo"), "ana.gomez");

    expect(screen.getAllByText("Tribunal Supremo Electoral").length).toBeGreaterThan(0);
    expect(screen.queryByText("Municipio de La Paz")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    await user.type(
      screen.getByPlaceholderText(/Indica una nota administrativa segura/i),
      "No se pudo verificar al solicitante",
    );
    await user.click(screen.getByRole("button", { name: /^Rechazar$/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Detalle de cambio de correo/i })).not.toBeInTheDocument();
    });
    expect(screen.getAllByText("Rechazada").length).toBeGreaterThan(0);
  });

  it("envía una solicitud pública de recuperación institucional con datos mock", async () => {
    const user = userEvent.setup();
    render(<InstitutionalRecoveryPublicPage />);

    expect(
      screen.getByRole("heading", { name: "Actualizar correo institucional" }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Institución"), "Tribunal");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await user.click(await screen.findByRole("option", { name: "Tribunal Supremo Electoral" }));
    await user.type(screen.getByLabelText(/Nombre completo/i), "Ana Gómez");
    await user.type(screen.getByLabelText(/Nuevo correo/i), "ana.gomez@tse.gob.bo");
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(screen.getByRole("heading", { name: "Solicitud enviada" })).toBeInTheDocument();
    expect(screen.getByText("Tribunal Supremo Electoral")).toBeInTheDocument();
    expect(screen.getByText("ana.gomez@tse.gob.bo")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("valida campos obligatorios de recuperación institucional pública y conserva volver al login", async () => {
    const user = userEvent.setup();
    render(<InstitutionalRecoveryPublicPage />);

    expect(screen.getByRole("link", { name: /Volver al login/i })).toHaveAttribute(
      "href",
      "/votacion/login",
    );

    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.queryByRole("heading", { name: "Solicitud enviada" })).not.toBeInTheDocument();
  });
});
