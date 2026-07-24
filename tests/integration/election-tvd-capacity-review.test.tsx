import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { useGetVotingEventTvdCapacityQuery } from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

type FetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
};

const fetchCalls: FetchCall[] = [];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const capacityResponse = {
  eventId: "evt-1",
  participantCount: 12,
  padronVersionId: "padron-1",
  tokensPerParticipant: "1",
  requiredTokens: "12",
  requiredSmallestUnit: "12000000000000000000",
  availableTokens: "20",
  availableSmallestUnit: "20000000000000000000",
  missingTokens: "0",
  missingSmallestUnit: "0",
  canPublish: true,
  reasonCode: null,
  balanceSource: "BLOCKCHAIN",
  usableBalanceField: "totalBalanceSmallestUnit",
  walletAddress: "0x1111111111111111111111111111111111111111",
} as const;

const installFetchMock = () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    fetchCalls.push({
      url: `${url.pathname}${url.search}`,
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? null : await request.text(),
    });

    if (url.pathname.endsWith("/voting/events/evt-1/tvd-capacity")) {
      return jsonResponse(capacityResponse);
    }

    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
};

const CapacityProbe = ({ eventId }: { eventId: string }) => {
  const { data, isLoading } = useGetVotingEventTvdCapacityQuery({ eventId });

  if (isLoading) return <p>Validando</p>;

  return (
    <div>
      <p>{data?.participantCount}</p>
      <p>{data?.canPublish ? "Puede continuar" : "No puede continuar"}</p>
    </div>
  );
};

describe("voting event TVD capacity endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCalls.length = 0;
    installFetchMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta capacidad definitiva por eventId sin enviar wallet, saldo ni participantCount", async () => {
    renderWithAuthStore(<CapacityProbe eventId="evt-1" />, {
      token: "jwt-token",
      accessToken: "jwt-token",
      role: "TENANT_ADMIN",
      active: true,
      tenantId: "tenant-1",
      activeContext: {
        type: "TENANT",
        tenantId: "tenant-1",
        tenantName: "Colegio Demo",
        role: "TENANT_ADMIN",
      },
      user: {
        id: "user-1",
        email: "admin@demo.bo",
        name: "Admin Demo",
        role: "TENANT_ADMIN",
        active: true,
        tenantId: "tenant-1",
        tenantName: "Colegio Demo",
      },
    });

    expect(await screen.findByText("Puede continuar")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("/api/v1/voting/events/evt-1/tvd-capacity");
    expect(fetchCalls[0].method).toBe("GET");
    expect(fetchCalls[0].headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(fetchCalls[0].headers.get("x-api-key")).toBeNull();
    expect(fetchCalls[0].body).toBeNull();
    expect(fetchCalls[0].url).not.toContain("wallet");
    expect(fetchCalls[0].url).not.toContain("participantCount");
    expect(fetchCalls[0].url).not.toContain("availableTokens");
    expect(fetchCalls[0].url).not.toContain("canPublish");
  });
});
