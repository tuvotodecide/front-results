import { installMatrixMockOnlyNetworkGuard } from "../../support/matrixNetworkGuard";

const createToken = (payload: Record<string, unknown>) => {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("MX-03 | autenticación y guards", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("[MX-03][AUT-STA-P0-002][E2E] bloquea una cuenta territorial pendiente antes de mostrar datos privados", () => {
    const verifyMockOnlyNetwork = installMatrixMockOnlyNetworkGuard("AUT-STA-P0-002");
    const pendingToken = createToken({
      sub: "pending-mx03",
      role: "MAYOR",
      active: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.visitWithAuth("/resultados/control-personal", {
      token: pendingToken,
      user: {
        id: "pending-mx03",
        email: "pendiente.mx03@example.test",
        name: "Cuenta pendiente",
        role: "MAYOR",
        active: false,
        status: "PENDING",
      },
      authSession: {
        role: "MAYOR",
        active: false,
        availableContexts: [],
        requiresContextSelection: false,
        defaultContext: null,
        activeContext: null,
        accessStatus: {
          tenant: {
            hasApprovedAccess: false,
            latestStatus: null,
            canRequest: false,
            shouldSelectTenantContext: false,
            message: "Sin acceso institucional activo.",
            items: [],
          },
          territorial: {
            hasApprovedAccess: false,
            status: "PENDING_APPROVAL",
            requestedRole: "MAYOR",
            votingDepartmentId: "dep-mx03",
            votingMunicipalityId: "mun-mx03",
            canRequest: false,
            message: "La solicitud territorial está pendiente de aprobación.",
          },
        },
      },
    });

    cy.location("pathname").should("eq", "/resultados/pendiente");
    cy.getCookie("tvd_auth_token").its("value").should("eq", pendingToken);
    cy.contains(/pendiente/i).should("be.visible");
    cy.contains(/Participación personal/i).should("not.exist");
    verifyMockOnlyNetwork();
  });

  it("[MX-03][AUT-GRD-P0-001][E2E] redirige a un visitante anónimo al login canónico y conserva el origen", () => {
    const verifyMockOnlyNetwork = installMatrixMockOnlyNetworkGuard("AUT-GRD-P0-001");

    cy.visit("/resultados/control-personal");

    cy.location("pathname").should("eq", "/resultados/login");
    cy.location("search").should("include", "from=%2Fresultados%2Fcontrol-personal");
    cy.get('[data-cy="login-email"]').should("be.visible");
    cy.contains(/Participación personal/i).should("not.exist");
    verifyMockOnlyNetwork();
  });
});
