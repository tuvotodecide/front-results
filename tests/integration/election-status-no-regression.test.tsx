import fs from "node:fs";
import path from "node:path";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
} from "./helpers/electionStatusTestUtils";

const root = process.cwd();

describe("Election status no regression", () => {
  beforeEach(() => {
    resetStatusMocks();
  });

  it("la ruta /status sigue apuntando a ActiveElectionStatusPage y no al review", () => {
    const statusRoute = fs.readFileSync(
      path.join(
        root,
        "src/app/(votacion-private)/votacion/elecciones/[electionId]/status/page.tsx",
      ),
      "utf8",
    );

    expect(statusRoute).toContain("ActiveElectionStatusPage");
    expect(statusRoute).not.toContain("ElectionConfigReview");
  });

  it("status no importa useElectionPublish ni componentes del rediseño de review", () => {
    const statusSource = fs.readFileSync(
      path.join(root, "src/features/electionConfig/ActiveElectionStatusPage.tsx"),
      "utf8",
    );

    expect(statusSource).toContain("useGetVotingEventQuery");
    expect(statusSource).toContain("useGetEventResultsQuery");
    expect(statusSource).toContain("useGetPadronVotersQuery");
    expect(statusSource).toContain("useGetParticipationAnalyticsQuery");
    expect(statusSource).toContain("useCreateEventNewsMutation");
    expect(statusSource).not.toContain("useElectionPublish");
    expect(statusSource).not.toContain("ReviewAccordionSection");
  });

  it("el componente de review verificado permanece disponible", () => {
    expect(
      fs.existsSync(
        path.join(
          root,
          "src/features/electionConfig/components/review/ReviewAccordionSection.tsx",
        ),
      ),
    ).toBe(true);
  });

  it("renderiza status sin mostrar la pantalla de revisión antes de publicar", () => {
    renderStatusPage();

    expect(screen.getByRole("heading", { name: "Elección de Diputados" })).toBeInTheDocument();
    expect(screen.queryByText("Revisión antes de publicar")).not.toBeInTheDocument();
  });
});
