export { };

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Clears localStorage and cookies.
             */
            clearSession(): Chainable<AUTWindow>;

            /**
             * Logs in via UI.
             * @param email The email to login with.
             * @param password The password to login with.
             */
            loginUI(email: string, password: string): Chainable<void>;

            /**
             * Visitas a page with active authentication by setting localStorage.
             * @param url The URL to visit.
             * @param auth Current auth state.
             */
            visitWithAuth(url: string, auth: { token: string; user: any }): Chainable<void>;

            /**
             * Seeds test data (no-op in this mock environment).
             */
            seedTestData(): Chainable<void>;

            /**
             * Cleans up test data (no-op).
             */
            cleanupTestData(): Chainable<void>;

            /**
             * Logs in via UI (v2).
             * @param email The email to login with.
             * @param password The password to login with.
             */
            loginUI2(email: string, password: string): Chainable<void>;
        }
    }
}
