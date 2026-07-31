import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImagesSection from "@/domains/resultados/components/ImagesSection";
import { buildResultsTableLink } from "@/utils/resultsTableLink";
import {
  FIVE_MINUTES_MS,
  isElectionInAutoRefreshWindow,
} from "@/utils/electionAutoRefreshWindow";

describe("MX-13 public results navigation and refresh", () => {
  it("[PUB-FIL-P1-001][PUB-MES-P0-002][PUB-CAT-P1-003] conserva electionId y electionType al navegar al detalle publico de mesa", () => {
    expect(
      buildResultsTableLink("M-001", {
        electionId: "election-1",
        electionType: "municipal",
      }),
    ).toBe("/resultados/mesa/M-001?electionId=election-1&electionType=municipal");

    expect(buildResultsTableLink("M-002", {})).toBe("/resultados/mesa/M-002");
  });

  it("[PUB-ACT-P0-003][PUB-CAS-P0-004][PUB-SEC-P0-001] muestra acta publica, version apoyada y enlaces sin datos administrativos", () => {
    render(
      <ImagesSection
        electionId="election-1"
        electionType="municipal"
        images={[
          {
            _id: "ballot-1",
            version: 2,
            image: "ipfs://cid-acta",
            recordId: "record-1",
            ipfsUri: "ipfs://metadata-1",
          },
        ]}
        mostSupportedBallot={{
          ballotId: "ballot-1",
          version: 2,
          supportCount: 4,
          totalAttestations: 5,
        }}
        attestationCases={[
          {
            ballotId: "ballot-1",
            supports: { users: 3, juries: 1 },
          },
        ]}
      />,
    );

    expect(screen.getByText("Hoja de trabajo electoral")).toBeInTheDocument();
    expect(screen.getByText("Mas apoyada")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Jurados")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Detalles" })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-1?electionId=election-1&electionType=municipal",
    );
    expect(screen.getByRole("link", { name: "Imagen" })).toHaveAttribute(
      "href",
      "https://ipfs.io/ipfs/cid-acta",
    );
    expect(JSON.stringify(document.body.textContent)).not.toContain("dni");
    expect(JSON.stringify(document.body.textContent)).not.toContain("wallet");
  });

  it("[PUB-UPD-P1-002] activa refresco de cinco minutos solo dentro de la ventana publica definida", () => {
    const votingStartDate = "2026-08-01T10:00:00.000Z";
    const resultsStartDate = "2026-08-01T18:00:00.000Z";

    expect(FIVE_MINUTES_MS).toBe(5 * 60 * 1000);
    expect(
      isElectionInAutoRefreshWindow(
        { votingStartDate, resultsStartDate },
        new Date("2026-08-01T09:00:00.000Z").getTime(),
      ),
    ).toBe(true);
    expect(
      isElectionInAutoRefreshWindow(
        { votingStartDate, resultsStartDate },
        new Date("2026-08-01T17:31:00.000Z").getTime(),
      ),
    ).toBe(false);
    expect(
      isElectionInAutoRefreshWindow(
        { votingStartDate: "invalida", resultsStartDate },
        new Date("2026-08-01T09:30:00.000Z").getTime(),
      ),
    ).toBe(false);
  });
});
