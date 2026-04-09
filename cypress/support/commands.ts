/// <reference types="cypress" />

const electionsConfig = require("../fixtures/elections_config.json");
const resultsOkDeputies = require("../fixtures/results_ok_deputies.json");
const resultsOkPresidential = require("../fixtures/results_ok_presidential.json");

type AuthSession = {
  token: string;
  user: unknown;
};

type MockConfigStatus = {
  hasActiveConfig: boolean;
  isVotingPeriod: boolean;
  isResultsPeriod: boolean;
};

type LiveResultsConfig = {
  presidential?: {
    statusCode?: number;
    body?: unknown;
    delayMs?: number;
  };
  deputies?: {
    statusCode?: number;
    body?: unknown;
    delayMs?: number;
  };
};

const AUTH_COOKIE_KEYS = {
  token: "tvd_auth_token",
  role: "tvd_auth_role",
  status: "tvd_auth_status",
  active: "tvd_auth_active",
} as const;

const buildSessionCookies = (session: AuthSession) => {
  const user = (session.user ?? {}) as Record<string, unknown>;
  const role = String(user.role ?? "publico");
  const status = String(
    user.status ?? ((user.active as boolean | undefined) ? "ACTIVE" : "PENDING"),
  );
  const active = String(Boolean(user.active));

  return [
    `${AUTH_COOKIE_KEYS.token}=${session.token}; Path=/; SameSite=Lax`,
    `${AUTH_COOKIE_KEYS.role}=${role}; Path=/; SameSite=Lax`,
    `${AUTH_COOKIE_KEYS.status}=${status}; Path=/; SameSite=Lax`,
    `${AUTH_COOKIE_KEYS.active}=${active}; Path=/; SameSite=Lax`,
  ];
};

Cypress.Commands.add("clearSession", () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

Cypress.Commands.add(
  "loginUI",
  (email: string, password: string = "test1234") => {
    cy.visit("/login");
    cy.get('[data-cy="login-email"]', { timeout: 10000 }).type(email);
    cy.get('[data-cy="login-password"]', { timeout: 10000 }).type(password);
    cy.get('[data-cy="login-submit"]', { timeout: 10000 }).click();
  },
);

Cypress.Commands.add("visitWithAuth", (url: string, session: AuthSession) => {
  const cookies = buildSessionCookies(session);
  cy.visit("/", {
    onBeforeLoad(win) {
      cookies.forEach((cookie) => {
        win.document.cookie = cookie;
      });
      win.localStorage.setItem("token", session.token);
      win.localStorage.setItem("user", JSON.stringify(session.user));
    },
  });
  cy.visit(url);
});

Cypress.Commands.add("seedTestData", () => {
  cy.log("seedTestData: no-op");
});

Cypress.Commands.add("cleanupTestData", () => {
  cy.log("cleanupTestData: no-op");
});

Cypress.Commands.add(
  "loginUI2",
  (email: string, password: string = "test1234") => {
    cy.loginUI(email, password);
  },
);

Cypress.Commands.add("mockConfigStatus", (config: MockConfigStatus) => {
  cy.intercept("GET", "**/api/v1/elections/config/status*", {
    statusCode: 200,
    body: config,
  }).as("configStatus");
});

Cypress.Commands.add("mockLiveResults", (config: LiveResultsConfig) => {
  if (config.presidential) {
    cy.intercept(
      "GET",
      "**/api/v1/results/live/by-location*electionType=presidential*",
      (req) => {
        req.reply({
          statusCode: config.presidential?.statusCode ?? 200,
          body: config.presidential?.body ?? resultsOkPresidential,
          delay: config.presidential?.delayMs ?? 0,
        });
      },
    ).as("liveResultsPresidential");
  }

  if (config.deputies) {
    cy.intercept(
      "GET",
      "**/api/v1/results/live/by-location*electionType=deputies*",
      (req) => {
        req.reply({
          statusCode: config.deputies?.statusCode ?? 200,
          body: config.deputies?.body ?? resultsOkDeputies,
          delay: config.deputies?.delayMs ?? 0,
        });
      },
    ).as("liveResultsDeputies");
  }
});

Cypress.Commands.add("mockConfig", (config?: unknown) => {
  cy.intercept("GET", "**/api/v1/elections/config*", {
    statusCode: 200,
    body: config ?? electionsConfig,
  }).as("config");

  cy.intercept("GET", "**/api/v1/contracts/public-active*", {
    statusCode: 200,
    body: { data: [] },
  }).as("publicContracts");
});

Cypress.Commands.add("mockDepartments", () => {
  cy.intercept("GET", "**/api/v1/geographic/departments*", {
    statusCode: 200,
    body: {
      data: [
        { _id: "dep-lpz", name: "La Paz" },
        { _id: "dep-cbba", name: "Cochabamba" },
      ],
    },
  }).as("departments");
});

Cypress.Commands.add("visitResults", (query?: Record<string, string>) => {
  const electionId = "election-mock-1";
  cy.visit("/resultados", {
    onBeforeLoad(win) {
      win.localStorage.setItem("selectedElectionId", electionId);
    },
    qs: query,
  });
});

Cypress.Commands.add("visitResultadosImagen", (id?: string) => {
  const url = id ? `/resultados/imagen/${id}` : "/resultados/imagen";
  cy.visit(url);
});

Cypress.Commands.add("mockGeographyBasic", () => {
  cy.mockDepartments();
  cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/dep-lpz*", {
    statusCode: 200,
    body: [{ _id: "prov-mur", name: "Murillo" }],
  }).as("provincesByDepartment");

  cy.intercept("GET", "**/api/v1/geographic/municipalities/by-province/prov-mur*", {
    statusCode: 200,
    body: [{ _id: "mun-lpz", name: "La Paz" }],
  }).as("municipalitiesByProvince");

  cy.intercept("GET", "**/api/v1/geographic/electoral-seats/by-municipality/mun-lpz*", {
    statusCode: 200,
    body: [{ _id: "seat-1", name: "Asiento 1" }],
  }).as("seatsByMunicipality");
});

Cypress.Commands.add("mockGeographyTwoDepts", () => {
  cy.mockDepartments();

  cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/dep-lpz*", {
    statusCode: 200,
    body: [{ _id: "prov-mur", name: "Murillo" }],
  }).as("provincesByDepartmentLp");

  cy.intercept("GET", "**/api/v1/geographic/municipalities/by-province/prov-mur*", {
    statusCode: 200,
    body: [{ _id: "mun-lpz", name: "La Paz" }],
  }).as("municipalitiesByProvinceMur");

  cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/dep-cbba*", {
    statusCode: 200,
    body: [{ _id: "prov-cerc", name: "Cercado" }],
  }).as("provincesByDepartmentCbba");

  cy.intercept("GET", "**/api/v1/geographic/electoral-seats/by-municipality/mun-lpz*", {
    statusCode: 200,
    body: [],
  }).as("seatsByMunicipality");
});

Cypress.Commands.add("mockTableSearchOk", (data: unknown) => {
  cy.intercept("GET", "**/api/v1/geographic/tables/search*", {
    statusCode: 200,
    body: [data],
  }).as("tableSearch");
});

Cypress.Commands.add("mockBallotById", (id: string, body: unknown) => {
  cy.intercept("GET", `**/api/v1/ballots/${id}*`, {
    statusCode: 200,
    body,
  }).as("ballotById");
});

Cypress.Commands.add("mockBallotNotFound", (id: string) => {
  cy.intercept("GET", `**/api/v1/ballots/${id}*`, {
    statusCode: 404,
    body: { message: `No se encontró la imagen "${id}"` },
  }).as("ballotById404");
});

Cypress.Commands.add("mockAttestationsByBallotId", (id: string, body: unknown[]) => {
  cy.intercept("GET", `**/api/v1/attestations/ballot/${id}*`, {
    statusCode: 200,
    body,
  }).as("attestationsByBallot");
});

Cypress.Commands.add("mockGeographyByIdBasic", () => {
  cy.intercept("GET", "**/api/v1/geographic/departments/dep-lpz*", {
    statusCode: 200,
    body: { _id: "dep-lpz", name: "La Paz" },
  }).as("departmentById");

  cy.intercept("GET", "**/api/v1/geographic/provinces/prov-mur*", {
    statusCode: 200,
    body: { _id: "prov-mur", name: "Murillo" },
  }).as("provinceById");

  cy.intercept("GET", "**/api/v1/geographic/municipalities/mun-lpz*", {
    statusCode: 200,
    body: { _id: "mun-lpz", name: "La Paz" },
  }).as("municipalityById");
});

Cypress.Commands.add("mockGeographyLongNames", () => {
  cy.intercept("GET", "**/api/v1/geographic/departments*", {
    statusCode: 200,
    body: {
      data: [
        {
          _id: "dep-long",
          name: "Departamento con un nombre extremadamente largo",
        },
      ],
    },
  }).as("departments");

  cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/dep-long*", {
    statusCode: 200,
    body: [
      {
        _id: "prov-long",
        name: "Provincia con un nombre extremadamente largo",
      },
    ],
  }).as("provincesByDepartmentLong");

  cy.intercept("GET", "**/api/v1/geographic/municipalities/by-province/prov-long*", {
    statusCode: 200,
    body: [
      {
        _id: "mun-long",
        name: "Municipio con un nombre extremadamente largo",
      },
    ],
  }).as("municipalitiesByProvinceLong");

  cy.intercept("GET", "**/api/v1/geographic/electoral-seats/by-municipality/mun-long*", {
    statusCode: 200,
    body: [],
  }).as("seatsByMunicipality");
});

Cypress.Commands.add("mockGeographyEmpty", () => {
  cy.intercept("GET", "**/api/v1/geographic/departments*", {
    statusCode: 200,
    body: { data: [] },
  }).as("departments");
});

Cypress.Commands.add("mockTablesByLocation", (config: { statusCode?: number; body?: unknown }) => {
  cy.intercept("GET", "**/api/v1/geographic/tables/by-location*", {
    statusCode: config.statusCode ?? 200,
    body: config.body ?? [],
  }).as("tablesByLocation");
});

Cypress.Commands.add("mockResultsBootstrap", () => {
  cy.mockConfig();
  cy.mockDepartments();
  cy.mockGeographyEmpty();
  cy.mockLiveResults({
    presidential: { body: resultsOkPresidential, delayMs: 0 },
    deputies: { body: resultsOkDeputies, delayMs: 0 },
  });
});
