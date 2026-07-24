import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TvdOperationsPage from "@/domains/superadmin/screens/TvdOperationsPage";
import type {
  TvdAdminOperation,
  TvdAdminOperationsResponse,
  TvdAdminInstitutionListResponse,
} from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

type CapturedRequest = {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  headers: Headers;
};

const institutionsResponse: TvdAdminInstitutionListResponse = {
  items: [
    {
      tenantId: "tenant-1",
      name: "Universidad Mayor de San Andrés",
      active: true,
      assignmentsCount: 2,
      eligibleWalletsCount: 2,
    },
    {
      tenantId: "tenant-2",
      name: "Municipio de La Paz",
      active: true,
      assignmentsCount: 1,
      eligibleWalletsCount: 1,
    },
  ],
  page: 1,
  limit: 100,
  total: 2,
  hasNextPage: false,
};

const operation = (
  overrides: Partial<TvdAdminOperation>,
): TvdAdminOperation => ({
  id: "operation-1",
  tenantId: "tenant-1",
  institutionName: "Universidad Mayor de San Andrés",
  operationType: "MANUAL_ASSIGNMENT",
  operationLabel: "Asignación manual",
  economicDirection: "IN",
  status: "CONFIRMED",
  statusLabel: "Confirmada",
  amount: "1000.25",
  amountSmallestUnit: "1000250000000000000000",
  txHash: "0x1234567890abcdef1234567890abcdef12345678",
  date: "2026-07-22T12:00:00.000Z",
  explorerUrl:
    "https://sepolia.basescan.org/tx/0x1234567890abcdef1234567890abcdef12345678",
  source: "TOKEN_ACCREDITATION",
  ...overrides,
});

const operationsResponse = (
  overrides: Partial<TvdAdminOperationsResponse> = {},
): TvdAdminOperationsResponse => ({
  items: [
    operation({ id: "manual-1" }),
    operation({
      id: "qr-1",
      operationType: "QR_RECHARGE",
      operationLabel: "Recarga mediante QR",
      amount: "2000.25",
      amountSmallestUnit: "2000250000000000000000",
      txHash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      explorerUrl:
        "https://sepolia.basescan.org/tx/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    }),
    operation({
      id: "vote-1",
      operationType: "VOTE_CONSUMPTION",
      operationLabel: "Consumo por voto",
      economicDirection: "OUT",
      amount: "125.25",
      amountSmallestUnit: "125250000000000000000",
      txHash: "0xvotevotevotevotevotevotevotevotevotevote",
      explorerUrl:
        "https://sepolia.basescan.org/tx/0xvotevotevotevotevotevotevotevotevotevote",
      source: "HISTORY",
    }),
    operation({
      id: "review-1",
      operationType: "VOTE_CONSUMPTION",
      operationLabel: "Consumo por voto",
      economicDirection: "OUT",
      status: "NEEDS_REVIEW",
      statusLabel: "Requiere revisión",
      amount: null,
      amountSmallestUnit: null,
      txHash: null,
      explorerUrl: null,
      source: "HISTORY",
    }),
  ],
  page: 1,
  limit: 20,
  total: 85,
  hasNextPage: true,
  summary: {
    totalOperations: 85,
    totalAssigned: "3000.50",
    totalConsumed: "125.25",
  },
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderOperationsPage = () =>
  renderWithAuthStore(<TvdOperationsPage />, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    availableContexts: [{ type: "GLOBAL_ADMIN", role: "SUPERADMIN" }],
    activeContext: { type: "GLOBAL_ADMIN", role: "SUPERADMIN" },
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
  });

const latestOperationsRequest = (captured: CapturedRequest[]) => {
  const requests = captured.filter(
    (request) =>
      request.method === "GET" &&
      request.pathname === "/api/v1/tvd/admin/operations",
  );
  return requests.at(-1);
};

const createFetchMock = (
  captured: CapturedRequest[],
  responseForOperations: (
    request: CapturedRequest,
  ) => Response | Promise<Response> = (request) => {
    const page = request.searchParams.get("page");
    if (page === "2") {
      return jsonResponse(
        operationsResponse({
          items: [operation({ id: "manual-page-2", amount: "10" })],
          page: 2,
          total: 85,
          hasNextPage: false,
        }),
      );
    }
    return jsonResponse(operationsResponse());
  },
) =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const capturedRequest = {
      method: request.method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      headers: request.headers,
    };
    captured.push(capturedRequest);

    if (url.pathname === "/api/v1/tvd/admin/institutions") {
      return jsonResponse(institutionsResponse);
    }
    if (url.pathname === "/api/v1/tvd/admin/operations") {
      return responseForOperations(capturedRequest);
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });

describe("Superadmin TVD operations", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consume instituciones y operaciones reales sin exponer ids tecnicos ni recalcular totales", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", createFetchMock(captured));

    renderOperationsPage();

    expect(
      await screen.findAllByText("Universidad Mayor de San Andrés"),
    ).not.toHaveLength(0);
    expect(screen.getByText("Municipio de La Paz")).toBeInTheDocument();
    expect(screen.getByText("Todas las instituciones")).toBeInTheDocument();
    expect(screen.queryByText("tenant-1")).not.toBeInTheDocument();
    expect(screen.queryByText("tenant-2")).not.toBeInTheDocument();

    expect(await screen.findAllByText("1000.25 $TVD")).not.toHaveLength(0);
    expect(screen.getAllByText("Recarga mediante QR")).not.toHaveLength(0);
    expect(screen.getAllByText("Consumo por voto")).not.toHaveLength(0);
    expect(screen.getAllByText("Monto no disponible")).not.toHaveLength(0);
    expect(screen.getAllByText("Comprobar operación")).not.toHaveLength(0);
    expect(screen.getAllByText("Operación aún no confirmada")).not.toHaveLength(0);
    expect(screen.getAllByText("3000.50 $TVD")).not.toHaveLength(0);
    expect(screen.getAllByText("125.25 $TVD")).not.toHaveLength(0);
    expect(screen.getAllByText("85")).not.toHaveLength(0);
    expect(screen.getAllByText(/0x1234567890.*345678/i)).not.toHaveLength(0);

    expect(screen.queryByText("MANUAL_ASSIGNMENT")).not.toBeInTheDocument();
    expect(screen.queryByText("QR_RECHARGE")).not.toBeInTheDocument();
    expect(screen.queryByText("VOTE_CONSUMPTION")).not.toBeInTheDocument();
    expect(screen.queryByText("TOKEN_ACCREDITATION")).not.toBeInTheDocument();
    expect(screen.queryByText("HISTORY")).not.toBeInTheDocument();
    expect(screen.queryByText("relatedAmount")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Institución"), "tenant-1");
    await waitFor(() => {
      expect(latestOperationsRequest(captured)?.searchParams.get("tenantId")).toBe(
        "tenant-1",
      );
    });

    await user.selectOptions(
      screen.getByLabelText("Tipo de operación"),
      "VOTE_CONSUMPTION",
    );
    await waitFor(() => {
      const request = latestOperationsRequest(captured);
      expect(request?.searchParams.get("operationType")).toBe(
        "VOTE_CONSUMPTION",
      );
      expect(request?.searchParams.get("page")).toBe("1");
    });

    await user.selectOptions(screen.getByLabelText("Estado"), "CONFIRMED");
    await waitFor(() => {
      const request = latestOperationsRequest(captured);
      expect(request?.searchParams.get("status")).toBe("CONFIRMED");
      expect(request?.searchParams.get("page")).toBe("1");
    });

    await user.type(screen.getByLabelText("Fecha desde"), "01/07/2026");
    await user.type(screen.getByLabelText("Fecha hasta"), "31/07/2026");
    await waitFor(() => {
      const request = latestOperationsRequest(captured);
      expect(request?.searchParams.get("dateFrom")).toContain("2026-07-01");
      expect(request?.searchParams.get("dateTo")).toContain("2026-07-31");
    });

    await user.click(screen.getAllByRole("button", { name: "Siguiente" })[0]);
    await waitFor(() => {
      expect(latestOperationsRequest(captured)?.searchParams.get("page")).toBe(
        "2",
      );
    });
    expect(await screen.findAllByText("Página 2. 1 operaciones de 85")).not.toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Siguiente" })[0]).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByLabelText("Institución")).toHaveValue("");
    expect(screen.getByLabelText("Tipo de operación")).toHaveValue("");
    expect(screen.getByLabelText("Estado")).toHaveValue("");
    expect(screen.getByLabelText("Fecha desde")).toHaveValue("");
    expect(screen.getByLabelText("Fecha hasta")).toHaveValue("");
  });

  it("muestra carga inicial sin datos mock", async () => {
    const captured: CapturedRequest[] = [];
    let resolveOperations: (response: Response) => void = () => undefined;
    const operationsPromise = new Promise<Response>((resolve) => {
      resolveOperations = resolve;
    });
    vi.stubGlobal(
      "fetch",
      createFetchMock(captured, () => operationsPromise),
    );

    renderOperationsPage();

    expect(await screen.findByText("Cargando operaciones...")).toBeInTheDocument();
    expect(screen.queryByText("Tribunal Nacional Simulado")).not.toBeInTheDocument();

    resolveOperations(jsonResponse(operationsResponse()));
    expect(await screen.findAllByText("1000.25 $TVD")).not.toHaveLength(0);
  });

  it("muestra estado vacio y errores seguros", async () => {
    const captured: CapturedRequest[] = [];
    vi.stubGlobal(
      "fetch",
      createFetchMock(captured, () =>
        jsonResponse(
          operationsResponse({
            items: [],
            total: 0,
            hasNextPage: false,
            summary: {
              totalOperations: 0,
              totalAssigned: "0",
              totalConsumed: "0",
            },
          }),
        ),
      ),
    );

    renderOperationsPage();

    expect(
      await screen.findAllByText("No existen operaciones para los filtros seleccionados."),
    ).not.toHaveLength(0);
  });

  it("traduce error de consulta amplia y error general de operaciones", async () => {
    const captured: CapturedRequest[] = [];
    const fetchMock = createFetchMock(captured, () =>
      jsonResponse({ code: "TVD_OPERATION_FILTER_TOO_BROAD" }, 400),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderOperationsPage();

    expect(
      await screen.findByText(
        "Hay demasiadas operaciones para mostrar. Selecciona una institución o reduce el rango de fechas.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("TVD_OPERATION_FILTER_TOO_BROAD"),
    ).not.toBeInTheDocument();
    unmount();

    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      createFetchMock([], () => jsonResponse({ code: "SERVER_ERROR" }, 500)),
    );
    renderOperationsPage();

    expect(
      await screen.findByText("No se pudieron cargar las operaciones."),
    ).toBeInTheDocument();
  });

  it("muestra error de instituciones y valida fechas antes de consultar operaciones", async () => {
    const user = userEvent.setup();
    const captured: CapturedRequest[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(input, init);
        const url = new URL(request.url);
        captured.push({
          method: request.method,
          pathname: url.pathname,
          searchParams: url.searchParams,
          headers: request.headers,
        });

        if (url.pathname === "/api/v1/tvd/admin/institutions") {
          return jsonResponse({ code: "SERVER_ERROR" }, 500);
        }
        if (url.pathname === "/api/v1/tvd/admin/operations") {
          return jsonResponse(operationsResponse());
        }
        return jsonResponse({ code: "NOT_FOUND" }, 404);
      }),
    );

    renderOperationsPage();

    expect(
      await screen.findByText("No se pudieron cargar las instituciones."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Fecha desde"), "31/07/2026");
    await waitFor(() => {
      expect(latestOperationsRequest(captured)?.searchParams.get("dateFrom")).toContain(
        "2026-07-31",
      );
    });
    const operationCallsBeforeInvalidRange = captured.filter(
      (request) => request.pathname === "/api/v1/tvd/admin/operations",
    ).length;
    await user.type(screen.getByLabelText("Fecha hasta"), "01/07/2026");

    expect(
      await screen.findByText("La fecha desde debe ser anterior a la fecha hasta."),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        captured.filter(
          (request) => request.pathname === "/api/v1/tvd/admin/operations",
        ),
      ).toHaveLength(operationCallsBeforeInvalidRange);
    });
  });

  it("conserva tabla desktop y cards moviles con datos coherentes", async () => {
    const captured: CapturedRequest[] = [];
    vi.stubGlobal("fetch", createFetchMock(captured));

    renderOperationsPage();

    expect(await screen.findAllByText("Asignación manual")).not.toHaveLength(0);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Tipo de operación")).toBeInTheDocument();
    expect(within(table).getAllByText("Universidad Mayor de San Andrés")).not.toHaveLength(0);
    expect(screen.getAllByText("Código de transacción")).not.toHaveLength(0);
    expect(screen.getAllByText("Página 1. 4 operaciones de 85")).not.toHaveLength(0);
  });

  it("no importa mocks productivos ni el servicio legado de operaciones", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/domains/superadmin/screens/TvdOperationsPage.tsx",
      ),
      "utf8",
    );

    expect(source).not.toContain("tvdOperationsMock");
    expect(source).not.toContain("getTvdOperations");
    expect(source).not.toContain("superadminTvdApi");
  });
});
