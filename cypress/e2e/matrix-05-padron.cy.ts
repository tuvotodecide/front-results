import { installMatrixMockOnlyNetworkGuard } from "../support/matrixNetworkGuard";

const eventDraft = {
  id: "event-mx05",
  tenantId: "tenant-smoke",
  name: "Elección MX05 Cypress",
  objective: "Padrón sintético",
  state: "DRAFT",
  status: "DRAFT",
  votingStart: "2027-01-10T08:00:00.000Z",
  votingEnd: "2027-01-10T18:00:00.000Z",
  resultsPublishAt: "2027-01-10T19:00:00.000Z",
  publishDeadline: "2027-01-09T08:00:00.000Z",
  publicEligibilityEnabled: true,
  isReferendum: false,
};

const parsedJob = {
  importJobId: "job-mx05",
  status: "PARSED",
  sourceType: "PDF",
  summary: {
    parsedCount: 2,
    stagingCount: 2,
    enabledCount: 2,
    validCount: 2,
    invalidCount: 0,
    duplicateCount: 0,
    disabledCount: 0,
    missingIdentityCount: 0,
    totalCount: 2,
  },
  errors: [],
};

const installPadronBootstrap = (options: { activeDraft: unknown; currentVersion: unknown; staging: unknown[] }) => {
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05", { statusCode: 200, body: eventDraft }).as("event");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/roles", { statusCode: 200, body: { data: [{ id: "role-mx05", eventId: "event-mx05", name: "Presidencia", maxWinners: 1 }] } }).as("roles");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/options", { statusCode: 200, body: { data: [{ id: "option-mx05", eventId: "event-mx05", name: "Frente Sintético", color: "#2E7D32", candidates: [] }] } }).as("options");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/review-readiness", { statusCode: 200, body: { id: "event-mx05", state: "DRAFT", isReady: false, pending: ["padron"], publicationWindow: { expired: false, canConfirmOfficialPublication: false } } }).as("reviewReadiness");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/summary", { statusCode: 200, body: { activeDraft: options.activeDraft, currentVersion: options.currentVersion, review: { pending: [] } } }).as("padronSummary");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/staging*", { statusCode: 200, body: { importJob: options.activeDraft, data: options.staging, page: 1, limit: 50, total: options.staging.length, totalPages: 1 } }).as("padronStaging");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/versions", { statusCode: 200, body: { data: options.currentVersion ? [options.currentVersion] : [] } }).as("padronVersions");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/voters*", { statusCode: 200, body: { voters: [], page: 1, total: 0, totalPages: 0 } }).as("padronVoters");
  cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/voters/summary", { statusCode: 200, body: { total: 0, enabled: 0, disabled: 0, participated: 0 } }).as("padronVotersSummary");
};

describe("MX-05 | padrón, staging y archivos", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("[MX-05][PAD-UPL-P0-001][E2E] carga un PDF permitido, consulta el job y muestra el resumen de staging", () => {
    const verifyMockOnlyNetwork = installMatrixMockOnlyNetworkGuard("PAD-UPL-P0-001");
    let importStatusCalls = 0;
    const importStatuses: string[] = [];
    let uploadCalls = 0;
    let parsedDraftAvailable = false;
    let seededStagingRecords = 0;
    const stagedRecords = [
      { id: "staging-mx05-1", ci: "TEST-1001", enabled: true, validationStatus: "VALID", sourceRow: 1 },
      { id: "staging-mx05-2", ci: "TEST-1002", enabled: true, validationStatus: "VALID", sourceRow: 2 },
    ];

    installPadronBootstrap({ activeDraft: null, currentVersion: null, staging: [] });
    cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/summary", (request) => {
      request.reply({
        statusCode: 200,
        body: {
          activeDraft: parsedDraftAvailable ? parsedJob : null,
          currentVersion: null,
          review: { pending: [] },
        },
      });
    }).as("updatedPadronSummary");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/staging*", (request) => {
      const records = seededStagingRecords === stagedRecords.length ? stagedRecords : [];
      request.reply({
        statusCode: 200,
        body: {
          importJob: parsedDraftAvailable ? parsedJob : null,
          data: records,
          page: 1,
          limit: 50,
          total: records.length,
          totalPages: 1,
        },
      });
    }).as("updatedPadronStaging");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/gemini-import", (request) => {
      expect(request.headers).to.have.property("content-type").and.include("multipart/form-data");
      request.reply({ statusCode: 200, body: { data: { records: [{ id: "gemini-1", carnet: "TEST-1001", enabled: true, sourceKind: "PARSED", sourceRow: 1, updatedAt: null }, { id: "gemini-2", carnet: "TEST-1002", enabled: true, sourceKind: "PARSED", sourceRow: 2, updatedAt: null }], observations: [] } } });
    }).as("geminiAnalysis");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/imports", (request) => {
      uploadCalls += 1;
      expect(request.headers).to.have.property("content-type").and.include("multipart/form-data");
      request.reply({ statusCode: 202, body: { ...parsedJob, status: "PROCESSING" } });
    }).as("uploadPadron");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/imports/job-mx05", (request) => {
      importStatusCalls += 1;
      if (importStatusCalls === 1) {
        importStatuses.push("PROCESSING");
        request.reply({ statusCode: 200, body: { ...parsedJob, status: "PROCESSING" } });
        return;
      }

      parsedDraftAvailable = true;
      importStatuses.push("PARSED");
      request.reply({ statusCode: 200, body: parsedJob });
    }).as("padronImportStatus");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/staging*", (request) => {
      seededStagingRecords += 1;
      request.reply({
        statusCode: 200,
        body: stagedRecords[seededStagingRecords - 1],
      });
    }).as("seedStaging");

    cy.setTenantSession("/votacion/elecciones/event-mx05/config/padron");
    cy.wait("@updatedPadronSummary");
    cy.location("pathname").should("eq", "/votacion/elecciones/event-mx05/config/padron");
    cy.contains("h1", "Elección MX05 Cypress").should("be.visible");
    cy.contains("Paso 3 de 3: Gestiona el padrón de la elección según la etapa actual.").should("be.visible");
    cy.contains("p", "Arrastra aquí el archivo del padrón electoral")
      .parent()
      .selectFile(
        { contents: Cypress.Buffer.from("padrón sintético"), fileName: "padron-mx05.pdf", mimeType: "application/pdf" },
        { action: "drag-drop" },
      );
    cy.contains("Analizando archivo del padrón...").should("be.visible");
    cy.wait("@geminiAnalysis");
    cy.wait("@uploadPadron");
    cy.wait("@padronImportStatus");
    cy.wait("@padronImportStatus");
    cy.wait("@seedStaging");
    cy.get('[role="dialog"][aria-label="Modal"]')
      .contains("button", "Ir al padrón")
      .scrollIntoView()
      .should("be.visible")
      .click();
    cy.contains("h3", "Padrón Electoral").should("be.visible");
    cy.contains("TEST-1001").should("be.visible");
    cy.then(() => {
      expect(uploadCalls).to.equal(1);
      expect(importStatuses).to.include("PROCESSING");
      expect(importStatuses).to.include("PARSED");
      expect(importStatusCalls).to.be.within(2, 45);
      expect(seededStagingRecords).to.equal(2);
    });
    verifyMockOnlyNetwork();
  });

  it("[MX-05][PAD-CFM-P0-001][E2E] confirma una vez automáticamente el staging al completar la carga y muestra la versión vigente", () => {
    const verifyMockOnlyNetwork = installMatrixMockOnlyNetworkGuard("PAD-CFM-P0-001");
    let confirmationCalls = 0;
    let confirmed = false;
    const currentVersion = { padronVersionId: "padron-mx05-v1", id: "padron-mx05-v1", totals: { validCount: 2, invalidCount: 0, duplicateCount: 0 }, createdAt: "2026-08-10T10:00:00.000Z", sourceType: "PDF_IMPORT", isCurrent: true };

    installPadronBootstrap({ activeDraft: parsedJob, currentVersion: null, staging: [{ id: "staging-mx05-1", ci: "TEST-1001", enabled: true, validationStatus: "VALID", sourceRow: 1 }] });
    cy.intercept("GET", "**/api/v1/voting/events/event-mx05", { statusCode: 200, body: { ...eventDraft, convocationNotifiedAt: "2026-08-01T10:00:00.000Z" } }).as("eventWithAutomaticConfirmation");
    cy.intercept("GET", "**/api/v1/voting/events/event-mx05/padron/summary", (request) => {
      if (confirmed) {
        request.alias = "confirmedPadronSummary";
      }
      request.reply({
        statusCode: 200,
        body: {
          activeDraft: confirmed ? null : parsedJob,
          currentVersion: confirmed ? currentVersion : null,
          review: { pending: [] },
        },
      });
    }).as("updatedPadronSummary");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/gemini-import", {
      statusCode: 200,
      body: { data: { records: [{ id: "gemini-confirm", carnet: "TEST-1001", enabled: true, sourceKind: "PARSED", sourceRow: 1, updatedAt: null }], observations: [] } },
    }).as("geminiForConfirmation");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/imports", { statusCode: 202, body: parsedJob }).as("uploadForConfirmation");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/staging*", { statusCode: 200, body: { id: "staging-confirm", ci: "TEST-1001", enabled: true, validationStatus: "VALID", sourceRow: 1 } });
    cy.intercept("DELETE", "**/api/v1/voting/events/event-mx05/padron/staging/staging-mx05-1*", {
      statusCode: 200,
      body: { id: "staging-mx05-1", deleted: true },
    }).as("removeInitialStaging");
    cy.intercept("POST", "**/api/v1/voting/events/event-mx05/padron/staging/confirm", (request) => {
      confirmationCalls += 1;
      expect(request.body).to.deep.equal({});
      confirmed = true;
      request.reply({ delay: 150, statusCode: 200, body: { importJobId: "job-mx05", padronVersionId: "padron-mx05-v1", totals: { validCount: 2, invalidCount: 0, duplicateCount: 0 }, comparisonStatus: "OK", sourceType: "PDF_IMPORT" } });
    }).as("confirmPadron");

    cy.setTenantSession("/votacion/elecciones/event-mx05/config/padron");
    cy.wait("@eventWithAutomaticConfirmation");
    cy.wait("@updatedPadronSummary");
    cy.wait("@padronStaging");
    cy.location("pathname").should("eq", "/votacion/elecciones/event-mx05/config/padron");
    cy.contains("h3", "Padrón Electoral").should("be.visible");
    cy.contains("button", "Reemplazar archivo").click();
    cy.get('input[type="file"].hidden').selectFile(
      { contents: Cypress.Buffer.from("confirmación sintética"), fileName: "padron-confirmacion.pdf", mimeType: "application/pdf" },
      { force: true },
    );
    cy.wait("@geminiForConfirmation");
    cy.wait("@uploadForConfirmation");
    cy.wait("@removeInitialStaging");
    cy.wait("@confirmPadron");
    cy.then(() => expect(confirmationCalls).to.equal(1));
    cy.wait("@confirmedPadronSummary")
      .its("response.body.currentVersion.padronVersionId")
      .should("eq", "padron-mx05-v1");
    cy.contains("Total Registros").should("be.visible");
    cy.contains("2").should("be.visible");
    verifyMockOnlyNetwork();
  });
});
