import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { vi } from "vitest";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import { AUTH_COOKIE_KEYS, config, handleVotacionAccess } from "../../middleware";

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/features/elections/data/useElectionRepository", () => ({
  useCreateElection: () => ({
    createElection: vi.fn(),
    creating: false,
    error: null,
  }),
}));

const createToken = (payload: Record<string, unknown>) => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
};

const createRequest = (pathname: string, cookies: Record<string, string> = {}) => {
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return new NextRequest(`http://localhost${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
};

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Compatibilidad", () => {
  it("D-COMPAT-006 | mantiene el wizard real de creacion en /votacion/elecciones/new", () => {
    render(<CreateElectionWizard />);

    expect(screen.getByText("Crear Nueva Votación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });

  it("D-COMPAT-007 | agrega rutas mock al middleware sin quitar rutas productivas", () => {
    expect(config.matcher).toContain("/votacion/recarga-operativa");
    expect(config.matcher).toContain("/votacion/cuenta-institucional");
    expect(config.matcher).toContain("/votacion/elecciones/new");
    expect(config.matcher).toContain("/votacion/elecciones/:electionId/status");
    expect(config.matcher).toContain("/votacion/elecciones/:electionId/config/:path*");
  });

  it("D-COMPAT-008 / D-PERM-005 | protege rutas nuevas igual que rutas privadas de votacion", () => {
    const anonymousResponse = handleVotacionAccess(createRequest("/votacion/recarga-operativa"));
    expect(anonymousResponse.headers.get("location")).toBe(
      "http://localhost/votacion/login",
    );

    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "TENANT_ADMIN",
      active: true,
    });
    const tenantResponse = handleVotacionAccess(
      createRequest("/votacion/cuenta-institucional", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "TENANT_ADMIN",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
      }),
    );

    expect(tenantResponse.headers.get("x-middleware-next")).toBe("1");
  });
});
