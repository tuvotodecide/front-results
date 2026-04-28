import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicLandingRepositoryApi } from "@/features/publicLanding/data/PublicLandingRepository.api";
import { publicLandingRepositoryMock } from "@/features/publicLanding/data/PublicLandingRepository.mock";

describe("PublicLandingRepositoryApi.getPastElections", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("includes active, upcoming and finished public elections", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          active: [
            {
              id: "active-1",
              name: "Elección activa",
              objective: "Activa",
              votingStart: "2026-06-01T10:00:00.000Z",
              votingEnd: "2026-06-01T18:00:00.000Z",
            },
          ],
          upcoming: [
            {
              id: "upcoming-1",
              name: "Elección próxima",
              objective: "Próxima",
              votingStart: "2026-06-02T10:00:00.000Z",
              votingEnd: "2026-06-02T18:00:00.000Z",
            },
          ],
          results: [
            {
              id: "finished-1",
              name: "Elección finalizada",
              objective: "Finalizada",
              votingStart: "2026-05-01T10:00:00.000Z",
              votingEnd: "2026-05-01T18:00:00.000Z",
            },
          ],
        }),
      })),
    );

    const repository = new PublicLandingRepositoryApi();
    const elections = await repository.getPastElections();

    expect(elections).toHaveLength(3);
    expect(elections.map((election) => election.status)).toEqual([
      "ACTIVA",
      "PROXIMA",
      "FINALIZADA",
    ]);
    expect(elections.map((election) => election.title)).toEqual([
      "Elección activa",
      "Elección próxima",
      "Elección finalizada",
    ]);
  });

  it("falls back to the mock repository when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network error");
      }),
    );
    const fallbackSpy = vi
      .spyOn(publicLandingRepositoryMock, "getPastElections")
      .mockResolvedValue([
        {
          id: "mock-1",
          title: "Fallback",
          organization: "Mock org",
          status: "FINALIZADA",
          isFeatured: false,
        },
      ]);

    const repository = new PublicLandingRepositoryApi();
    const elections = await repository.getPastElections();

    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(elections).toEqual([
      expect.objectContaining({
        id: "mock-1",
        title: "Fallback",
        status: "FINALIZADA",
      }),
    ]);
  });
});
