/// <reference types="cypress" />

/**
 * Protección acotada a los specs canónicos MX-03–MX-06.
 *
 * El frontend se inicia en CI con NEXT_PUBLIC_BASE_API_URL apuntando a este
 * host inexistente. Cada endpoint permitido se registra después de este
 * fallback; cualquier API que no tenga mock queda registrada y recibe 599.
 */
const MOCK_API_ORIGIN = "http://127.0.0.1:3999";

export const installMatrixMockOnlyNetworkGuard = (specName: string) => {
  const unexpectedRequests: string[] = [];

  cy.intercept(`${MOCK_API_ORIGIN}/api/**`, (request) => {
    unexpectedRequests.push(`${request.method} ${request.url}`);
    request.reply({
      statusCode: 599,
      body: { message: "Solicitud API no mockeada en Cypress" },
    });
  }).as("unexpectedMockApiRequest");

  cy.intercept(
    { url: /^https?:\/\/(?!127\.0\.0\.1(?::\d+)?\/|localhost(?::\d+)?\/).*/ },
    (request) => {
      if (request.resourceType === "fetch" || request.resourceType === "xhr") {
        unexpectedRequests.push(`${request.method} ${request.url}`);
        request.destroy();
      }
    },
  );

  return () => {
    cy.then(() => {
      expect(
        unexpectedRequests,
        `${specName} no debe emitir solicitudes de negocio sin mock`,
      ).to.deep.equal([]);
    });
  };
};
