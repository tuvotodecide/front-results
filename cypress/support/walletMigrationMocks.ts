/// <reference types="cypress" />

/**
 * Las pantallas de votaciones consultan si la institución sigue esperando la migración de su
 * billetera on-chain. Por defecto los specs simulan una institución ya migrada (sin bloqueo).
 */
export const mockWalletMigrationGate = (
  tenantId: string,
  overrides: Record<string, unknown> = {},
) => {
  cy.intercept("GET", "**/api/v1/institutional-wallet-migrations/status*", {
    statusCode: 200,
    body: {
      tenantId,
      blocking: false,
      reason: "NONE",
      status: null,
      institutionalRole: "PRIMARY",
      message: null,
      ...overrides,
    },
  }).as("walletMigrationGate");
};
