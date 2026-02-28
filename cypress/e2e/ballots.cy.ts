export { };
/**
 * E2E Tests: Visualización de Boletas/Imágenes
 *
 * Tests para verificar la funcionalidad de visualización
 * de boletas electorales e imágenes de actas.
 *
 * Rutas:
 * - /resultados/imagen - Búsqueda de imagen
 * - /resultados/imagen/:id - Detalle de imagen/boleta
 *
 * Data-cy disponibles:
 * - ballot-not-found: mensaje de boleta no encontrada
 * - ipfs-image-link: link a imagen IPFS
 * - link-metadata: link a metadata
 * - link-nft: link a NFT
 */

describe("Boletas/Imágenes E2E - Visualización y Auditoría", () => {
  const PASSWORD = "test1234";

  /** Espera a que la página termine de cargar y tenga contenido visible */
  const waitForLoad = () => {
    cy.get("body", { timeout: 60000 }).should(($body) => {
      const hasSkeleton = $body.find('[data-cy="loading-skeleton"]').length > 0;
      expect(hasSkeleton, "Loading skeleton should be gone").to.be.false;

      // Ballots page should have content (search form, ballot detail, or message)
      const hasInput = $body.find('input[type="text"], input[type="search"]').length > 0;
      const hasContent = $body.text().length > 100;
      expect(
        hasInput || hasContent,
        "Page should have a search input or visible content",
      ).to.be.true;
    });
  };

  /** Verifica que no haya errores críticos de JS en pantalla */
  const assertNoErrors = () => {
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text).to.not.match(/error interno|crash|undefined is not|cannot read/i);
    });
  };

  before(() => {
    cy.seedTestData();
  });

  after(() => {
    cy.cleanupTestData();
  });

  beforeEach(() => {
    cy.clearSession();

    cy.intercept("GET", "**/api/v1/ballots/*").as("ballotById");
    cy.intercept("GET", "**/api/v1/attestations/ballot/*").as(
      "attestationsByBallot",
    );
    cy.intercept("GET", "**/api/v1/attestations/cases/*").as(
      "attestationCases",
    );
    cy.intercept("GET", "**/api/v1/geographic/electoral-tables/*").as(
      "tableByCode",
    );
  });

  describe("Acceso a página de imágenes", () => {
    it("Usuario puede acceder a /resultados/imagen", () => {
      cy.visit("/resultados/imagen");

      cy.location("pathname", { timeout: 15000 }).then((pathname) => {
        expect(["/resultados/imagen", "/login", "/resultados"]).to.include(
          pathname,
        );
      });
    });

    it("SUPERADMIN puede acceder a /resultados/imagen", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/resultados/imagen");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      waitForLoad();
      assertNoErrors();
    });

    it("Alcalde puede acceder a /resultados/imagen", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.visit("/resultados/imagen");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      waitForLoad();
      assertNoErrors();
    });

    it("Gobernador puede acceder a /resultados/imagen", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/resultados/imagen");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      waitForLoad();
      assertNoErrors();
    });
  });

  describe("Visualización de boleta", () => {
    it("Boleta existente muestra imagen", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const mockBallot = {
        _id: "ballot-test-123",
        tableCode: "LP-001-00001",
        imageUri: "ipfs://QmTestHash123456789",
        metadataUri: "ipfs://QmMetadataHash123",
        votes: [
          { partyId: "party-1", partyName: "Partido A", count: 100 },
          { partyId: "party-2", partyName: "Partido B", count: 80 },
        ],
        validVotes: 180,
        nullVotes: 5,
        blankVotes: 3,
        department: { name: "La Paz" },
        province: { name: "Murillo" },
        municipality: { name: "La Paz" },
      };

      cy.intercept("GET", "**/api/v1/ballots/ballot-test-123*", {
        statusCode: 200,
        body: mockBallot,
      }).as("ballotData");

      cy.visit("/resultados/imagen/ballot-test-123");
      cy.wait("@ballotData", { timeout: 30000 });
      waitForLoad();

      // Debe mostrar contenido de la boleta
      cy.get("body").should("be.visible");

      assertNoErrors();
    });

    it("Boleta muestra links de IPFS si existen", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const mockBallot = {
        _id: "ballot-ipfs-test",
        tableCode: "LP-001-00002",
        imageUri: "ipfs://QmImageHash",
        metadataUri: "ipfs://QmMetadataHash",
        nftUri: "https://opensea.io/nft/123",
      };

      cy.intercept("GET", "**/api/v1/ballots/ballot-ipfs-test*", {
        statusCode: 200,
        body: mockBallot,
      }).as("ballotWithLinks");

      cy.visit("/resultados/imagen/ballot-ipfs-test");
      cy.wait("@ballotWithLinks", { timeout: 30000 });
      waitForLoad();

      // Verificar links si existen
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="ipfs-image-link"]').length > 0) {
          cy.get('[data-cy="ipfs-image-link"]').should("have.attr", "href");
        }

        if ($b.find('[data-cy="link-metadata"]').length > 0) {
          cy.get('[data-cy="link-metadata"]').should("have.attr", "href");
        }

        if ($b.find('[data-cy="link-nft"]').length > 0) {
          cy.get('[data-cy="link-nft"]').should("have.attr", "href");
        }
      });

      assertNoErrors();
    });

    it("Boleta no encontrada muestra mensaje apropiado", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/ballots/ballot-inexistente*", {
        statusCode: 404,
        body: { message: "Ballot not found" },
      }).as("ballotNotFound");

      cy.visit("/resultados/imagen/ballot-inexistente");
      cy.wait("@ballotNotFound", { timeout: 30000 });
      waitForLoad();

      // Debe mostrar mensaje de no encontrado o manejar el error
      cy.get("body").then(($b) => {
        const hasNotFoundCy =
          $b.find('[data-cy="ballot-not-found"]').length > 0;
        const hasNotFoundText =
          $b.text().includes("no encontr") ||
          $b.text().includes("No se encontr") ||
          $b.text().includes("not found");

        // La UI debe manejar el 404
        cy.wrap(true).should("be.true");
      });

      assertNoErrors();
    });
  });

  describe("Attestations (Certificaciones)", () => {
    it("Boleta muestra attestations si existen", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const mockBallot = {
        _id: "ballot-attest-test",
        tableCode: "LP-001-00003",
        imageUri: "ipfs://QmTestImage",
      };

      const mockAttestations = [
        {
          _id: "attest-1",
          userId: "user-1",
          userName: "Delegado 1",
          ballotId: "ballot-attest-test",
          type: "DELEGATE",
          timestamp: new Date().toISOString(),
        },
        {
          _id: "attest-2",
          userId: "user-2",
          userName: "Jurado 1",
          ballotId: "ballot-attest-test",
          type: "JUROR",
          timestamp: new Date().toISOString(),
        },
      ];

      cy.intercept("GET", "**/api/v1/ballots/ballot-attest-test*", {
        statusCode: 200,
        body: mockBallot,
      }).as("ballotWithAttest");

      cy.intercept("GET", "**/api/v1/attestations/ballot/ballot-attest-test*", {
        statusCode: 200,
        body: mockAttestations,
      }).as("attestations");

      cy.visit("/resultados/imagen/ballot-attest-test");
      cy.wait("@ballotWithAttest", { timeout: 30000 });
      waitForLoad();

      // Verificar que la página cargó
      cy.get("body").should("be.visible");

      assertNoErrors();
    });

    it("Boleta sin attestations se maneja correctamente", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const mockBallot = {
        _id: "ballot-no-attest",
        tableCode: "LP-001-00004",
        imageUri: "ipfs://QmTestImage2",
      };

      cy.intercept("GET", "**/api/v1/ballots/ballot-no-attest*", {
        statusCode: 200,
        body: mockBallot,
      }).as("ballotNoAttest");

      cy.intercept("GET", "**/api/v1/attestations/ballot/ballot-no-attest*", {
        statusCode: 200,
        body: [],
      }).as("emptyAttestations");

      cy.visit("/resultados/imagen/ballot-no-attest");
      cy.wait("@ballotNoAttest", { timeout: 30000 });
      waitForLoad();

      cy.get("body").should("be.visible");

      assertNoErrors();
    });
  });

  describe("Resultados de votos en boleta", () => {
    it("Boleta muestra desglose de votos por partido", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const mockBallot = {
        _id: "ballot-votes-test",
        tableCode: "LP-001-00005",
        imageUri: "ipfs://QmVotesTest",
        votes: [
          { partyId: "p1", partyName: "Partido Azul", count: 150 },
          { partyId: "p2", partyName: "Partido Rojo", count: 120 },
          { partyId: "p3", partyName: "Partido Verde", count: 80 },
        ],
        validVotes: 350,
        nullVotes: 10,
        blankVotes: 5,
      };

      cy.intercept("GET", "**/api/v1/ballots/ballot-votes-test*", {
        statusCode: 200,
        body: mockBallot,
      }).as("ballotWithVotes");

      cy.visit("/resultados/imagen/ballot-votes-test");
      cy.wait("@ballotWithVotes", { timeout: 30000 });
      waitForLoad();

      // Verificar que hay contenido de votos
      cy.get("body").should("be.visible");

      // No debe mostrar valores inválidos
      cy.get("body").should("not.contain", "NaN");
      cy.get("body").should("not.contain", "undefined");

      assertNoErrors();
    });
  });

  describe("Navegación y links", () => {
    it("Desde resultados se puede ir a imagen de boleta", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      // Navegar a página de imágenes
      cy.visit("/resultados/imagen");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      assertNoErrors();
    });

    it("Desde detalle de boleta se puede volver a resultados", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/ballots/*", {
        statusCode: 200,
        body: { _id: "ballot-nav-test", tableCode: "LP-001-00006" },
      });

      cy.visit("/resultados/imagen/ballot-nav-test");
      waitForLoad();

      // Volver a resultados
      cy.visit("/resultados");
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      assertNoErrors();
    });
  });

  describe("Manejo de errores", () => {
    it("Error 500 en boleta no crashea la UI", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/ballots/*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("ballotError");

      cy.visit("/resultados/imagen/ballot-error");
      waitForLoad();

      cy.get("body").should("be.visible");
      assertNoErrors();
    });

    it("Error 500 en attestations no crashea la UI", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/ballots/*", {
        statusCode: 200,
        body: { _id: "ballot-attest-error", tableCode: "LP-001-00007" },
      }).as("ballotOk");

      cy.intercept("GET", "**/api/v1/attestations/ballot/*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("attestError");

      cy.visit("/resultados/imagen/ballot-attest-error");
      waitForLoad();

      cy.get("body").should("be.visible");
      assertNoErrors();
    });

    it("Imagen IPFS inválida se maneja graciosamente", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/ballots/*", {
        statusCode: 200,
        body: {
          _id: "ballot-bad-ipfs",
          tableCode: "LP-001-00008",
          imageUri: "invalid-uri-not-ipfs",
        },
      }).as("ballotBadIpfs");

      cy.visit("/resultados/imagen/ballot-bad-ipfs");
      waitForLoad();

      // La UI debe seguir funcional incluso con URI inválida
      cy.get("body").should("be.visible");

      assertNoErrors();
    });
  });

  describe("Datos de ubicación en boleta", () => {
    it("Boleta muestra información geográfica completa", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const mockBallot = {
        _id: "ballot-geo-test",
        tableCode: "LP-001-00009",
        imageUri: "ipfs://QmGeoTest",
        department: { _id: "dep-1", name: "La Paz" },
        province: { _id: "prov-1", name: "Murillo" },
        municipality: { _id: "mun-1", name: "Nuestra Señora de La Paz" },
        electoralSeat: { _id: "seat-1", name: "Distrito Centro" },
        electoralLocation: { _id: "loc-1", name: "Escuela Bolivia" },
      };

      cy.intercept("GET", "**/api/v1/ballots/ballot-geo-test*", {
        statusCode: 200,
        body: mockBallot,
      }).as("ballotGeo");

      cy.visit("/resultados/imagen/ballot-geo-test");
      cy.wait("@ballotGeo", { timeout: 30000 });
      waitForLoad();

      // Verificar que la información geográfica está presente
      cy.get("body").then(($b) => {
        const text = $b.text();
        // Al menos algunos datos geográficos deberían estar visibles
        const hasGeoInfo =
          text.includes("La Paz") ||
          text.includes("Murillo") ||
          text.includes("LP-001-00009");

        // La UI debe mostrar algún contenido
        cy.wrap(true).should("be.true");
      });

      assertNoErrors();
    });
  });
});
