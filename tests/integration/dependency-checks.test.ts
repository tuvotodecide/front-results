import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { apiSlice } from "@/store/apiSlice";
import {
  auditSummary,
  countedTables,
  delegateActivity,
  delegateTableActivity,
  executiveSummary,
  mayorContract,
  resultadosSummary,
} from "../fixtures/admin/resultadosReports";
import {
  completeReadiness,
  padronActiveDraft,
  padronStagingEntries,
  readyForReviewEvent,
} from "../fixtures/admin/padronPublication";

const projectRoot = process.cwd();

const readProjectFile = (path: string) =>
  readFileSync(resolve(projectRoot, path), "utf8");

describe("frontend dependency validation checks", () => {
  it("documents the public runtime variables required by frontend integrations", () => {
    const envExample = readProjectFile(".env.example");

    expect(envExample).toContain("VITE_BASE_API_URL=http://localhost:3000/api/v1");
    expect(envExample).toContain("VITE_BASE_NFT_URL=");
    expect(envExample).toContain("VITE_APP_MODE=voting");
    expect(envExample).toContain("VITE_VOTE_CONTRACT_ADDRESS=");
    expect(envExample).toContain("VITE_VOTE_CHAIN_ID=");
  });

  it("keeps the API base URL centralized and configured with a local fallback", () => {
    const apiSliceSource = readProjectFile("src/store/apiSlice.ts");
    const runtimeEnvSource = readProjectFile("src/shared/system/runtimeEnv.ts");

    expect(apiSlice.reducerPath).toBe("api");
    expect(apiSliceSource).toContain('getRuntimeEnv("VITE_BASE_API_URL", "NEXT_PUBLIC_BASE_API_URL")');
    expect(apiSliceSource).toContain('"http://localhost:3000/api/v1"');
    expect(apiSliceSource).toContain("fetchBaseQuery");
    expect(apiSliceSource).toContain("prepareHeaders");
    expect(runtimeEnvSource).toContain("NEXT_PUBLIC_BASE_API_URL");
    expect(runtimeEnvSource).toContain("NEXT_PUBLIC_APP_MODE");
  });

  it("keeps RTK Query dependency tags for the admin integration domains", () => {
    expect(apiSlice.reducerPath).toBe("api");

    const apiSliceSource = readProjectFile("src/store/apiSlice.ts");
    expect(apiSliceSource).toContain('"Resultados"');
    expect(apiSliceSource).toContain('"ClientReports"');
    expect(apiSliceSource).toContain('"VotingEvents"');
    expect(apiSliceSource).toContain('"VotingEventPadron"');
    expect(apiSliceSource).toContain('"VotingEventNews"');
    expect(apiSliceSource).toContain('"AccessApprovals"');
  });

  it("keeps mock contracts consumable for resultados reports and audit states", () => {
    expect(resultadosSummary.results).toHaveLength(2);
    expect(resultadosSummary.summary.validVotes).toBeGreaterThan(0);
    expect(countedTables[0]).toMatchObject({ tableCode: "LP-001-01" });
    expect(auditSummary.details[0]).toMatchObject({
      recinto: "Unidad Educativa Central",
      auditoria: "No coincide",
    });
    expect(mayorContract).toMatchObject({
      electionId: "election-2026",
      role: "MAYOR",
      active: true,
    });
    expect(executiveSummary.summary.participationRate).toBe("66.67%");
    expect(delegateTableActivity.data[0].attestationDetails[0].delegateName).toBe("Ana Delegada");
    expect(delegateActivity.data.some((delegate) => delegate.totalAttestations === 0)).toBe(true);
  });

  it("keeps mock contracts consumable for publication and visible result evidence", () => {
    expect(readyForReviewEvent).toMatchObject({
      id: "evt-1",
      status: "READY_FOR_REVIEW",
      publicEligibilityEnabled: true,
    });
    expect(completeReadiness).toMatchObject({
      isReady: true,
      publicationWindow: {
        canConfirmOfficialPublication: true,
      },
    });
    expect(padronActiveDraft.summary.enabledCount).toBe(3);
    expect(padronStagingEntries).toHaveLength(3);
  });

  it("keeps optional staging validation disabled by default", () => {
    expect(process.env.FRONTEND_DEPENDENCY_STAGING_CHECK).not.toBe("true");
  });
});
