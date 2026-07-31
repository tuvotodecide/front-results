import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicElectionRepositoryApi } from "@/features/publicElectionDetail/data/PublicElectionRepository.api";

describe("PublicElectionRepositoryApi (MX-13)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[PUB-ACC-P0-002][PUB-STA-P0-001][PUB-INF-P0-001][PUB-INF-P0-002] mapea detalle publico valido y estados sin exponer campos administrativos", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "event 1",
        name: "Elección pública",
        objective: "Elegir autoridades",
        phase: "ACTIVE",
        votingStart: "2026-08-01T08:00:00.000Z",
        votingEnd: "2026-08-01T16:00:00.000Z",
        resultsPublishAt: "2026-08-01T18:00:00.000Z",
        isReferendum: false,
        publicEligibilityEnabled: true,
        adminUsers: [{ email: "admin@example.test" }],
        wallet: "0xprivate",
        options: [
          {
            id: "option-1",
            name: "Frente Azul",
            color: "#2563eb",
            active: true,
            candidates: [{ id: "candidate-1", name: "Ana Pérez", roleName: "Alcaldía" }],
          },
        ],
        resultsAvailable: false,
        results: [{ option: "Frente Azul", votes: 99 }],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const repository = new PublicElectionRepositoryApi();
    const detail = await repository.getPublicElectionDetail("event 1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/voting/events/public/detail/event%201"),
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(detail).toEqual(
      expect.objectContaining({
        id: "event 1",
        title: "Elección pública",
        subtitle: "Elegir autoridades",
        status: "LIVE",
        results: null,
        publicEligibilityEnabled: true,
      }),
    );
    expect(detail?.ballotParties).toEqual([
      expect.objectContaining({
        name: "Frente Azul",
        candidates: [expect.objectContaining({ fullName: "Ana Pérez", positionName: "Alcaldía" })],
      }),
    ]);
    expect(JSON.stringify(detail)).not.toContain("admin@example.test");
    expect(JSON.stringify(detail)).not.toContain("0xprivate");
  });

  it("[PUB-RES-P0-001][PUB-RES-P0-002][PUB-CNS-P0-002] calcula distribucion publica, blancos, empate y cero votos sin declarar ganador oficial backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          id: "event-results",
          name: "Con resultados",
          objective: "Publicada",
          phase: "RESULTS",
          isReferendum: false,
          votingStart: "2026-07-30T08:00:00.000Z",
          votingEnd: "2026-07-30T16:00:00.000Z",
          resultsPublishAt: "2026-07-30T18:00:00.000Z",
          resultsAvailable: true,
          options: [
            { id: "a", name: "Frente A", color: "#111827", candidates: [{ name: "A", roleName: "Presidencia" }] },
            { id: "b", name: "Frente B", color: "#047857", candidates: [{ name: "B", roleName: "Presidencia" }] },
          ],
          results: [
            { option: "Frente A", votes: 10 },
            { option: "Frente B", votes: 10 },
            { option: "BLANK", votes: 5 },
          ],
        }),
      })),
    );

    const repository = new PublicElectionRepositoryApi();
    const detail = await repository.getPublicElectionDetail("event-results");

    expect(detail?.status).toBe("FINISHED");
    expect(detail?.results?.totalVotes).toBe(25);
    expect(detail?.results?.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ party: "Frente A", votes: 10, percent: 40 }),
        expect.objectContaining({ party: "Frente B", votes: 10, percent: 40 }),
        expect.objectContaining({ party: "Votos en Blanco", votes: 5, percent: 20 }),
      ]),
    );
    expect(detail?.winnerCandidateId).toBeNull();
  });

  it("[PUB-CNS-P0-001][PUB-STA-P1-002][PUB-SEC-P0-002] devuelve nulo o error controlado para detalle inexistente o no disponible", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ internal: "stack" }) });
    vi.stubGlobal("fetch", fetchMock);

    const repository = new PublicElectionRepositoryApi();

    await expect(repository.getPublicElectionDetail("missing")).resolves.toBeNull();
    await expect(repository.getPublicElectionDetail("error")).rejects.toThrow(
      "No se pudo cargar el detalle público",
    );
  });
});
