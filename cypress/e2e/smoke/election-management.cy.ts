import { installMatrixMockOnlyNetworkGuard } from "../../support/matrixNetworkGuard";

describe("MX-04 | creación de votaciones", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("[MX-04][ELE-NEW-P0-006][E2E] crea una votación DRAFT una sola vez y navega al siguiente paso", () => {
    const verifyMockOnlyNetwork = installMatrixMockOnlyNetworkGuard("ELE-NEW-P0-006");
    let createRequestCount = 0;
    const createdElection = {
      id: "event-mx04-created",
      tenantId: "tenant-smoke",
      name: "Elección MX04 Cypress",
      objective: "Validar creación aislada en navegador",
      state: "DRAFT",
      status: "DRAFT",
      isReferendum: false,
      isOpenVoting: false,
      votingStart: "2027-01-10T08:00:00.000Z",
      votingEnd: "2027-01-10T18:00:00.000Z",
      resultsPublishAt: "2027-01-10T19:00:00.000Z",
    };

    cy.intercept("GET", "**/api/v1/voting/events*", {
      statusCode: 200,
      body: { data: [] },
    }).as("eventsList");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx04-created", {
      statusCode: 200,
      body: createdElection,
    }).as("createdElection");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx04-created/roles", {
      statusCode: 200,
      body: { data: [] },
    }).as("createdElectionRoles");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx04-created/options", {
      statusCode: 200,
      body: { data: [] },
    }).as("createdElectionOptions");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx04-created/padron/versions", {
      statusCode: 200,
      body: { data: [] },
    }).as("createdElectionPadronVersions");
    cy.intercept("GET", "**/api/v1/tvd/me/summary*", {
      statusCode: 200,
      body: {
        tenantId: "tenant-smoke",
        assignmentId: "assignment-mx04",
        wallet: "0x0000000000000000000000000000000000000001",
        walletStatus: "VERIFIED",
        balanceStatus: "AVAILABLE",
        balance: "20",
        formattedBalance: "20",
        decimals: 18,
        balanceErrorCode: null,
        assignedBalance: { smallestUnit: "20000000000000000000", formatted: "20" },
        liquidBalance: { smallestUnit: "20000000000000000000", formatted: "20" },
        totalBalance: { smallestUnit: "20000000000000000000", formatted: "20" },
        tokenSymbol: "TVD",
        chainId: null,
        contractAddress: null,
        assignmentContractAddress: null,
        lastAccreditation: null,
        pendingAccreditationsCount: 0,
      },
    }).as("tvdSummary");
    cy.intercept("POST", "**/api/v1/tvd/me/estimated-capacity", (request) => {
      expect(request.body).to.deep.equal({
        estimatedParticipants: "2",
        tenantId: "tenant-smoke",
      });
      request.reply({
        statusCode: 200,
        body: {
          estimatedParticipants: "2",
          tokensPerParticipant: "1",
          estimatedRequiredTokens: "2",
          estimatedRequiredSmallestUnit: "2",
          availableTokens: "20",
          availableSmallestUnit: "20",
          estimatedMissingTokens: "0",
          estimatedMissingSmallestUnit: "0",
          hasEstimatedCapacity: true,
          reasonCode: null,
          balanceSource: "BLOCKCHAIN",
          usableBalanceField: "liquidBalanceSmallestUnit",
          walletAddress: "0x0000000000000000000000000000000000000001",
        },
      });
    }).as("estimateCapacity");
    cy.intercept("POST", "**/api/v1/voting/events", (request) => {
      createRequestCount += 1;
      expect(request.body).to.include({
        tenantId: "tenant-smoke",
        name: "Elección MX04 Cypress",
        objective: "Validar creación aislada en navegador",
        isReferendum: false,
        isOpenVoting: false,
      });
      request.reply({
        delay: 150,
        statusCode: 201,
        body: {
          ...createdElection,
          votingStart: request.body.votingStart,
          votingEnd: request.body.votingEnd,
          resultsPublishAt: request.body.resultsPublishAt,
        },
      });
    }).as("createElection");

    cy.setTenantSession("/votacion/elecciones");
    cy.wait("@eventsList");
    cy.wait("@tvdSummary");
    cy.location("pathname").should("eq", "/votacion/elecciones");
    cy.contains("button", "Nueva Votación").click();
    cy.contains("Estimar participantes").should("be.visible");
    cy.get("#estimated-voters").type("2");
    cy.contains("button", "Validar capacidad").click();
    cy.wait("@estimateCapacity").its("response.statusCode").should("eq", 200);
    cy.get('[role="dialog"][aria-label="Estimar participantes"]').within(() => {
      cy.contains("button", "Crear votación").click();
    });
    cy.location("pathname").should("eq", "/votacion/elecciones/new");

    cy.get("#institution").type("Elección MX04 Cypress");
    cy.get("#description").type("Validar creación aislada en navegador");
    cy.contains("button", "Siguiente").click();
    cy.get("#votingStartDate").type("2027-01-10T08:00");
    cy.get("#votingEndDate").type("2027-01-10T18:00");
    cy.get("#resultsDate").type("2027-01-10T19:00");
    cy.contains("button", "CREAR").click();
    cy.contains("¿Crear votación?").should("be.visible");
    cy.contains("button", "Confirmar").click();
    cy.contains("button", "Creando...").should("be.disabled");

    cy.wait("@createElection").its("response.statusCode").should("eq", 201);
    cy.then(() => expect(createRequestCount).to.equal(1));
    cy.location("pathname").should("eq", "/votacion/elecciones/event-mx04-created/config/cargos");
    verifyMockOnlyNetwork();
  });
});
