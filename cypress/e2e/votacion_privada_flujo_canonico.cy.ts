const createToken = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${header}.${body}.signature`;
};

describe("votación privada canónica", () => {
  it("recorre new, cargos, planchas, padrón, review y status con backend mockeado", () => {
    const now = Date.now();
    const startIso = new Date(now + 48 * 60 * 60 * 1000).toISOString();
    const endIso = new Date(now + 49 * 60 * 60 * 1000).toISOString();
    const resultsIso = new Date(now + 50 * 60 * 60 * 1000).toISOString();
    const eventId = "event-canonical-1";
    const accessToken = createToken({
      sub: "tenant-admin-1",
      role: "TENANT_ADMIN",
      active: true,
      tenantId: "tenant-1",
      exp: Math.floor(now / 1000) + 3600,
    });

    let event = {
      id: eventId,
      tenantId: "tenant-1",
      name: "Votación Canonical Demo",
      objective: "Elegir directorio estudiantil",
      votingStart: startIso,
      votingEnd: endIso,
      resultsPublishAt: resultsIso,
      status: "DRAFT",
      publicEligibilityEnabled: true,
    };

    let roles: Array<{
      id: string;
      eventId: string;
      name: string;
      maxWinners: number;
      createdAt: string;
    }> = [];

    let options: Array<{
      id: string;
      eventId: string;
      name: string;
      color: string;
      logoUrl: string;
      createdAt: string;
      candidates: Array<{
        id: string;
        optionId: string;
        name: string;
        photoUrl: string;
        roleName: string;
      }>;
    }> = [];

    let padronImported = false;

    cy.intercept(
      {
        method: "GET",
        url: /\/api\/v1\/voting\/events(\?.*)?$/,
      },
      {
      statusCode: 200,
      body: { data: [event] },
      },
    ).as("getVotingEvents");

    cy.intercept("POST", "**/api/v1/voting/events", (req) => {
      const body = req.body as Record<string, string>;
      event = {
        ...event,
        name: String(body.name ?? event.name),
        objective: String(body.objective ?? event.objective),
        votingStart: String(body.votingStart ?? event.votingStart),
        votingEnd: String(body.votingEnd ?? event.votingEnd),
        resultsPublishAt: String(body.resultsPublishAt ?? event.resultsPublishAt),
      };

      req.reply({
        statusCode: 201,
        body: { data: event },
      });
    }).as("createVotingEvent");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}`, {
      statusCode: 200,
      body: { data: event },
    }).as("getVotingEvent");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}/roles`, () => {
      return {
        statusCode: 200,
        body: { data: roles },
      };
    }).as("getRoles");

    cy.intercept("POST", `**/api/v1/voting/events/${eventId}/roles`, (req) => {
      const body = req.body as Record<string, string>;
      const created = {
        id: `role-${roles.length + 1}`,
        eventId,
        name: String(body.name ?? "Cargo"),
        maxWinners: 1,
        createdAt: new Date().toISOString(),
      };
      roles = [...roles, created];
      req.reply({
        statusCode: 201,
        body: { data: created },
      });
    }).as("createRole");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}/options`, () => {
      return {
        statusCode: 200,
        body: { data: options },
      };
    }).as("getOptions");

    cy.intercept("POST", `**/api/v1/voting/events/${eventId}/options`, (req) => {
      const body = req.body as Record<string, string>;
      const created = {
        id: `party-${options.length + 1}`,
        eventId,
        name: String(body.name ?? "Partido"),
        color: String(body.color ?? "#2E7D32"),
        logoUrl: String(body.logoUrl ?? ""),
        createdAt: new Date().toISOString(),
        candidates: [],
      };
      options = [created];
      req.reply({
        statusCode: 201,
        body: { data: created },
      });
    }).as("createOption");

    cy.intercept("PUT", `**/api/v1/voting/events/${eventId}/options/*/candidates`, (req) => {
      const optionId = String(req.url.split("/options/")[1]?.split("/")[0] ?? "");
      const body = req.body as { candidates?: Array<Record<string, string>> };
      options = options.map((option) =>
        option.id === optionId
          ? {
              ...option,
              candidates: (body.candidates ?? []).map((candidate, index) => ({
                id: `${optionId}-candidate-${index + 1}`,
                optionId,
                name: String(candidate.name ?? ""),
                photoUrl: String(candidate.photoUrl ?? ""),
                roleName: String(candidate.roleName ?? ""),
              })),
            }
          : option,
      );

      const updated = options.find((option) => option.id === optionId);
      req.reply({
        statusCode: 200,
        body: { data: updated },
      });
    }).as("replaceCandidates");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}/padron/versions`, () => {
      return {
        statusCode: 200,
        body: {
          data: padronImported
            ? [
                {
                  padronVersionId: "padron-v1",
                  totals: {
                    validCount: 1,
                    invalidCount: 0,
                    duplicateCount: 0,
                  },
                  createdAt: new Date().toISOString(),
                  isCurrent: true,
                },
              ]
            : [],
        },
      };
    }).as("getPadronVersions");

    cy.intercept("POST", `**/api/v1/voting/events/${eventId}/padron/import`, (req) => {
      padronImported = true;
      req.reply({
        statusCode: 200,
        body: {
          padronVersionId: "padron-v1",
          totals: {
            validCount: 1,
            invalidCount: 0,
            duplicateCount: 0,
          },
          createdAt: new Date().toISOString(),
        },
      });
    }).as("importPadron");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}/padron/voters*`, () => {
      return {
        statusCode: 200,
        body: padronImported
          ? {
              data: [
                {
                  id: "voter-1",
                  carnetNorm: "12345678",
                  enabled: true,
                  createdAt: new Date().toISOString(),
                },
              ],
              total: 1,
              page: 1,
              limit: 50,
              totalPages: 1,
            }
          : { data: [], total: 0, page: 1, limit: 50, totalPages: 0 },
      };
    }).as("getPadronVoters");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}/padron/voters/summary`, {
      statusCode: 200,
      body: {
        enabledToVote: 1,
        disabledToVote: 0,
      },
    }).as("getPadronSummary");

    cy.intercept("GET", `**/api/v1/voting/events/${eventId}/results`, {
      statusCode: 200,
      body: {
        eventId,
        roles: [
          {
            roleName: "Presidencia",
            total: 1,
            ranking: [
              {
                optionId: "party-green",
                optionName: "Frente Verde",
                votes: 1,
                percentage: 100,
              },
            ],
            winners: ["Frente Verde"],
          },
        ],
      },
    }).as("getEventResults");

    cy.visitWithAuth("/votacion/elecciones", {
      token: accessToken,
      user: {
        id: "tenant-admin-1",
        email: "tenant@test.com",
        name: "Tenant Admin",
        role: "TENANT_ADMIN",
        active: true,
        status: "ACTIVE",
        tenantId: "tenant-1",
      },
    });

    cy.contains("Mis Votaciones").should("be.visible");
    cy.contains("Nueva Votación").click();
    cy.location("pathname").should("eq", "/votacion/elecciones/new");

    cy.get("#institution").type("Votación Canonical Demo");
    cy.get("#description").type("Elegir directorio estudiantil");
    cy.contains("button", "Siguiente").click();

    cy.get("#votingStartDate").type(startIso.slice(0, 16));
    cy.get("#votingEndDate").type(endIso.slice(0, 16));
    cy.get("#resultsDate").type(resultsIso.slice(0, 16));
    cy.contains("button", "CREAR").click();
    cy.contains("button", "Confirmar").click();

    cy.wait("@createVotingEvent");
    cy.location("pathname").should(
      "eq",
      `/votacion/elecciones/${eventId}/config/cargos`,
    );
    cy.contains("Paso 1 de 3").should("be.visible");

    cy.contains("Agregar Cargo").click();
    cy.get("#positionName").clear().type("Presidencia");
    cy.contains("button", "Guardar Cargo").click();
    cy.wait("@createRole");
    cy.contains("Siguiente: Agregar planchas y candidatos").click();

    cy.location("pathname").should(
      "eq",
      `/votacion/elecciones/${eventId}/config/planchas`,
    );
    cy.contains("Paso 2 de 3").should("be.visible");
    cy.contains("Crear Partido").click();
    cy.get('input[placeholder="Ej: Movimiento Futuro"]').type("Frente Verde");
    cy.get('input[placeholder="#2E7D32"]').clear().type("#2E7D32");
    cy.get('input[type="file"][accept="image/*"]').first().selectFile(
      {
        contents: Cypress.Buffer.from("logo"),
        fileName: "logo.png",
        mimeType: "image/png",
      },
      { force: true },
    );
    cy.contains("button", "Guardar y Continuar").click();
    cy.wait("@createOption");

    cy.get('input[placeholder="Nombre completo"]').type("Ana Pérez");
    cy.get('input[type="file"][accept="image/*"]').selectFile(
      {
        contents: Cypress.Buffer.from("candidate"),
        fileName: "candidate.png",
        mimeType: "image/png",
      },
      { force: true },
    );
    cy.contains("button", "Guardar Candidatos").click();
    cy.wait("@replaceCandidates");
    cy.contains("Siguiente: Subir Padrón").click();

    cy.location("pathname").should(
      "eq",
      `/votacion/elecciones/${eventId}/config/padron`,
    );
    cy.contains("Paso 3 de 3").should("be.visible");
    cy.get('input[type="file"][accept=".csv"]').selectFile(
      {
        contents: Cypress.Buffer.from("dni,habilitado\n12345678,si"),
        fileName: "padron.csv",
        mimeType: "text/csv",
      },
      { force: true },
    );
    cy.contains("button", "Subir padrón").click();
    cy.wait("@importPadron");
    cy.contains("Finalizar configuración").click();

    cy.location("pathname").should(
      "eq",
      `/votacion/elecciones/${eventId}/config/review`,
    );
    cy.wait("@getPadronSummary");
    cy.contains("Revisa antes de publicar").should("be.visible");
    cy.contains("Padrón cargado").should("be.visible");

    cy.then(() => {
      event = {
        ...event,
        status: "PUBLISHED",
      };
    });

    cy.visitWithAuth(`/votacion/elecciones/${eventId}/status`, {
      token: accessToken,
      user: {
        id: "tenant-admin-1",
        email: "tenant@test.com",
        name: "Tenant Admin",
        role: "TENANT_ADMIN",
        active: true,
        status: "ACTIVE",
        tenantId: "tenant-1",
      },
    });

    cy.wait("@getEventResults");
    cy.location("pathname").should("eq", `/votacion/elecciones/${eventId}/status`);
    cy.contains("Estado Actual").should("be.visible");
    cy.contains("Papeleta Electoral").should("be.visible");
  });
});
