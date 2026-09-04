import { installMatrixMockOnlyNetworkGuard } from "../support/matrixNetworkGuard";

const qrImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==";

const payment = (status: string, accreditationStatus: string) => ({
  paymentId: "payment-mx06",
  amount: "10.50",
  amountMinor: "1050",
  currency: "BOB",
  status,
  provider: "RED_ENLACE",
  merchantReference: "MX06-REF-001",
  qrImage,
  qrExpiresAt: "2027-01-10T19:00:00.000Z",
  createdAt: "2026-08-10T10:00:00.000Z",
  accreditationId: "accreditation-mx06",
  accreditationStatus,
  txHash: null,
});

describe("MX-06 | QR, acreditación y capacidad TVD", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("[MX-06][TVD-UI-P2-004][E2E] separa pago confirmado de acreditación y conserva el contexto de revisión", () => {
    const verifyMockOnlyNetwork = installMatrixMockOnlyNetworkGuard("TVD-UI-P2-004");
    let paymentReads = 0;
    let exposeRecoverablePayment = false;
    cy.intercept("GET", "**/api/v1/tvd/me/summary*", {
      statusCode: 200,
      body: {
        tenantId: "tenant-smoke",
        assignmentId: "assignment-mx06",
        wallet: null,
        walletStatus: "VERIFIED",
        balanceStatus: "NOT_APPLICABLE",
        balance: null,
        formattedBalance: null,
        decimals: null,
        balanceErrorCode: null,
        assignedBalance: null,
        liquidBalance: null,
        totalBalance: null,
        tokenSymbol: "TVD",
        chainId: null,
        contractAddress: null,
        assignmentContractAddress: null,
        lastAccreditation: null,
        pendingAccreditationsCount: 1,
      },
    }).as("tvdSummary");
    cy.intercept("GET", "**/api/v1/tvd/me/payments*", (request) => {
      const items = exposeRecoverablePayment
        ? [payment("PAYMENT_CONFIRMED", paymentReads >= 3 ? "CONFIRMED" : "PENDING")]
        : [];
      request.reply({
        statusCode: 200,
        body: { items, page: 1, limit: 5, total: items.length, hasNextPage: false },
      });
    }).as("paymentHistory");
    // Techo de recarga: ruta interna de Next (mismo origen, fuera del guard de
    // red). Sin mock lee la blockchain real y en CI responde 503, con lo que la
    // pantalla deja "Generar QR" deshabilitado por diseño. 1000 TVD cubre
    // holgadamente los 21 TVD que cotiza este escenario.
    cy.intercept("GET", "**/api/tvd/institutional-vesting-balance", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          raw: "1000000000000000000000",
          decimals: 18,
          formatted: "1000 TVD",
          readAt: "2026-08-10T12:00:00.000Z",
        },
      },
    }).as("institutionalVestingBalance");
    cy.intercept("GET", "**/api/v1/tvd/me/quote*", (request) => {
      expect(request.query).to.include({ amount: "10.50", currency: "BOB" });
      request.reply({ statusCode: 200, body: { fiatAmount: "10.50", fiatAmountMinor: "1050", fiatCurrency: "BOB", estimatedTvd: "21", estimatedTvdSmallestUnit: "21000000000000000000", bobPerToken: "0.50", exchangeRateVersion: 1, quotedAt: "2026-08-10T12:00:00.000Z" } });
    }).as("tvdQuote");
    cy.intercept("POST", "**/api/v1/payments/qr", (request) => {
      expect(request.body).to.deep.equal({
        amount: "10.50",
        currency: "BOB",
        description: "Recarga operativa",
        tenantId: "tenant-smoke",
      });
      expect(request.headers).to.have.property("idempotency-key").and.not.be.empty;
      request.reply({ statusCode: 201, body: { id: "payment-mx06", tenantId: "tenant-smoke", requestedByUserId: "tenant-smoke", amount: "10.50", amountMinor: "1050", currency: "BOB", status: "QR_ACTIVE", provider: "RED_ENLACE", merchantReference: "MX06-REF-001", qrImage, qrExpiresAt: "2027-01-10T19:00:00.000Z", tokenAccreditation: { id: "accreditation-mx06", status: "PENDING", tokenAmount: "21" }, regenerationStatus: "NOT_REGENERABLE", regenerationReason: "" } });
    }).as("createQrPayment");
    cy.intercept("GET", "**/api/v1/tvd/me/payments/payment-mx06*", (request) => {
      expect(request.query).to.include({ tenantId: "tenant-smoke" });
      paymentReads += 1;
      request.reply({
        statusCode: 200,
        body:
          paymentReads === 1
            ? payment("QR_ACTIVE", "PENDING")
            : paymentReads === 2
              ? payment("PAYMENT_CONFIRMED", "PENDING")
              : payment("PAYMENT_CONFIRMED", "CONFIRMED"),
      });
    }).as("paymentStatus");

    cy.intercept("GET", "**/api/v1/voting/events/event-mx06", {
      statusCode: 200,
      body: {
        id: "event-mx06",
        tenantId: "tenant-smoke",
        name: "Elección MX06 Cypress",
        objective: "Revisión controlada de TVD",
        state: "READY_FOR_REVIEW",
        status: "READY_FOR_REVIEW",
        votingStart: "2027-01-10T08:00:00.000Z",
        votingEnd: "2027-01-10T18:00:00.000Z",
        resultsPublishAt: "2027-01-10T19:00:00.000Z",
        publishDeadline: "2027-01-09T08:00:00.000Z",
        publicEligibilityEnabled: true,
        publicEligibility: true,
        isReferendum: false,
      },
    }).as("reviewEvent");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/roles", { statusCode: 200, body: { data: [{ id: "role-mx06", eventId: "event-mx06", name: "Presidencia", maxWinners: 1 }] } }).as("reviewRoles");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/options", { statusCode: 200, body: { data: [{ id: "option-mx06", eventId: "event-mx06", name: "Frente TVD", color: "#2E7D32", active: true, candidates: [{ id: "candidate-mx06", name: "Candidata TVD", roleName: "Presidencia" }] }] } }).as("reviewOptions");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/padron/versions", { statusCode: 200, body: { data: [{ id: "padron-mx06", padronVersionId: "padron-mx06", totals: { validCount: 2, invalidCount: 0, duplicateCount: 0 }, isCurrent: true, sourceType: "PDF_IMPORT", createdAt: "2026-08-10T10:00:00.000Z" }] } }).as("reviewVersions");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/padron/summary", { statusCode: 200, body: { activeDraft: null, currentVersion: { id: "padron-mx06", padronVersionId: "padron-mx06", totals: { validCount: 2, invalidCount: 0, duplicateCount: 0 }, isCurrent: true, sourceType: "PDF_IMPORT", createdAt: "2026-08-10T10:00:00.000Z" }, review: { pending: [] } } }).as("reviewPadronWorkflow");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/padron/voters/summary", { statusCode: 200, body: { total: 2, enabledToVote: 2, disabledToVote: 0 } }).as("reviewPadronSummary");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/review-readiness", { statusCode: 200, body: { id: "event-mx06", state: "READY_FOR_REVIEW", isReady: true, pending: [], publicationWindow: { deadline: "2027-01-09T08:00:00.000Z", canConfirmOfficialPublication: true, expired: false } } }).as("reviewReadiness");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/official-publication/requests/active", { statusCode: 200, body: { request: null, latestAttempt: null } }).as("activePublicationRequest");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx06/tvd-capacity", (request) => {
      request.reply({
        statusCode: 200,
        body: {
          eventId: "event-mx06",
          participantCount: 2,
          padronVersionId: "padron-mx06",
          tokensPerParticipant: "1",
          requiredTokens: "2",
          requiredSmallestUnit: "2",
          availableTokens: "0",
          availableSmallestUnit: "0",
          missingTokens: "2",
          missingSmallestUnit: "2",
          canPublish: false,
          reasonCode: "INSUFFICIENT_TVD_BALANCE",
          publicationReadiness: "INSUFFICIENT_TVD_BALANCE",
          balanceSource: "BLOCKCHAIN",
          usableBalanceField: "liquidBalanceSmallestUnit",
          walletAddress: "0x0000000000000000000000000000000000000001",
        },
      });
    });

    cy.setTenantSession("/votacion/elecciones/event-mx06/config/review");
    cy.wait([
      "@reviewEvent",
      "@reviewRoles",
      "@reviewOptions",
      "@reviewVersions",
      "@reviewPadronWorkflow",
      "@reviewPadronSummary",
      "@reviewReadiness",
      "@activePublicationRequest",
    ]);
    cy.location("pathname").should("eq", "/votacion/elecciones/event-mx06/config/review");
    cy.contains("button", "Recargar tokens").click();
    cy.location("pathname", { timeout: 30000 }).should("eq", "/votacion/recarga-operativa");
    cy.contains("h1", "Recarga operativa").should("be.visible");
    cy.wait("@tvdSummary");
    // El techo de recarga habilita "Generar QR": esperarlo evita depender del
    // reintento de actionability de Cypress.
    cy.wait("@institutionalVestingBalance");
    cy.get("#recharge-amount").type("10.50");
    cy.wait("@tvdQuote");
    cy.contains("Saldo disponible para acreditación: 1000 TVD").should("be.visible");
    cy.contains("button", "Generar QR").click();
    cy.wait("@createQrPayment");
    cy.get('img[alt="Código QR para pagar la recarga TVD"]').should("be.visible");
    cy.contains("MX06-REF-001").should("be.visible");
    cy.wait("@paymentStatus");
    cy.contains("QR generado. Esperando confirmación del pago.").should("be.visible");

    cy.wait("@paymentStatus", { requestTimeout: 10000 });
    cy.contains("Procesando tokens").should("be.visible");

    cy.then(() => {
      exposeRecoverablePayment = true;
    });
    cy.wait("@paymentStatus", { requestTimeout: 10000 });
    cy.contains("Tokens recibidos").should("be.visible");
    cy.contains("TVD acreditados correctamente.").should("be.visible");
    cy.contains("h2", "Últimos movimientos")
      .parents("section")
      .within(() => {
        cy.contains("Pago confirmado").should("be.visible");
        cy.contains("Tokens recibidos").should("be.visible");
      });
    cy.contains("button", "Actualizar saldo").click();
    cy.wait("@tvdSummary");

    cy.go("back");
    cy.location("pathname").should("eq", "/votacion/elecciones/event-mx06/config/review");
    cy.contains("h2", "Capacidad TVD").should("be.visible");
    cy.contains("button", "Confirmar publicación oficial").should("be.disabled");
    cy.then(() => {
      expect(paymentReads).to.equal(3);
    });
    verifyMockOnlyNetwork();
  });
});
