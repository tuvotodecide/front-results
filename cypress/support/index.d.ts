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

            /**
             * Mock de configuración de la elección.
             */
            mockConfigStatus(config: { hasActiveConfig: boolean; isVotingPeriod: boolean; isResultsPeriod: boolean }): Chainable<void>;

            /**
             * Mock de resultados en vivo.
             */
            mockLiveResults(config: any): Chainable<void>;

            /**
             * Mock de configuración de elecciones.
             */
            mockConfig(config?: any[]): Chainable<void>;

            /**
             * Mock de departamentos geográficos.
             */
            mockDepartments(): Chainable<void>;

            /**
             * Visita la página de resultados con filtros opcionales.
             */
            visitResults(query?: any): Chainable<void>;

            /**
             * Visita la página de imagen de resultado.
             */
            visitResultadosImagen(id?: string): Chainable<void>;

            /**
             * Mock de estructura geográfica básica.
             */
            mockGeographyBasic(): Chainable<void>;

            /**
             * Mock de dos departamentos con sus provincias y municipios.
             */
            mockGeographyTwoDepts(): Chainable<void>;

            /**
             * Mock de búsqueda de mesa exitosa.
             */
            mockTableSearchOk(data: any): Chainable<void>;

            /**
             * Mock de boleta/acta por ID.
             */
            mockBallotById(id: string, body: any): Chainable<void>;

            /**
             * Mock de no encontrado para boleta.
             */
            mockBallotNotFound(id: string): Chainable<void>;

            /**
             * Mock de atestiguaciones por ID de boleta.
             */
            mockAttestationsByBallotId(id: string, body: any[]): Chainable<void>;

            /**
             * Mock de geografía (municipio, provincia, depto) por ID.
             */
            mockGeographyByIdBasic(): Chainable<void>;

            /**
             * Mock de geografía con nombres largos para pruebas de UI.
             */
            mockGeographyLongNames(): Chainable<void>;

            /**
             * Mock de geografía vacía.
             */
            mockGeographyEmpty(): Chainable<void>;

            /**
             * Mock de mesas por ubicación.
             */
            mockTablesByLocation(config: any): Chainable<void>;

            /**
             * Comando auxiliar para inicializar mocks básicos.
             */
            mockResultsBootstrap(): Chainable<void>;
        }
    }
}
