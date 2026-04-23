import {
  canEditElectionBeforeCutoff,
  canEditPadronInLimitedMode,
  getPublishDeadlineMs,
  isAfterPublishCutoffBeforeVoting,
  MIN_CREATE_LEAD_MS,
  PRE_PUBLICATION_CUTOFF_MS,
  validateScheduleFieldErrors,
} from "@/features/electionConfig/renderUtils";

const NOW = new Date("2026-04-17T12:00:00.000Z").getTime();
const isoAfter = (ms: number) => new Date(NOW + ms).toISOString();

describe("election render rules", () => {
  it("keeps full edition only before official publication and before the 6h publication limit", () => {
    const draftBeforeLimit = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(60 * 60 * 60 * 1000),
      votingEnd: isoAfter(72 * 60 * 60 * 1000),
    };

    expect(canEditElectionBeforeCutoff(draftBeforeLimit, NOW)).toBe(true);

    expect(
      canEditElectionBeforeCutoff(
        { ...draftBeforeLimit, status: "OFFICIALLY_PUBLISHED" },
        NOW,
      ),
    ).toBe(false);

    expect(
      canEditElectionBeforeCutoff(
        { ...draftBeforeLimit, status: "PUBLICATION_EXPIRED" },
        NOW,
      ),
    ).toBe(false);
  });

  it("uses the 6h publication limit and the 12h create validation constants", () => {
    const event = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(48 * 60 * 60 * 1000),
    };

    expect(MIN_CREATE_LEAD_MS).toBe(12 * 60 * 60 * 1000);
    expect(PRE_PUBLICATION_CUTOFF_MS).toBe(6 * 60 * 60 * 1000);
    expect(getPublishDeadlineMs(event)).toBe(
      new Date(event.votingStart).getTime() - PRE_PUBLICATION_CUTOFF_MS,
    );
  });

  it("detects the read-only period after the publication limit and before voting", () => {
    const event = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(5 * 60 * 60 * 1000),
      votingEnd: isoAfter(36 * 60 * 60 * 1000),
    };

    expect(isAfterPublishCutoffBeforeVoting(event, NOW)).toBe(true);
  });

  it("allows only limited padron edition when backend exposes the limited mode flag", () => {
    const publishedEvent = {
      status: "OFFICIALLY_PUBLISHED",
      votingStart: isoAfter(12 * 60 * 60 * 1000),
      votingEnd: isoAfter(36 * 60 * 60 * 1000),
      canEditPadronInLimitedMode: true,
    };

    expect(canEditPadronInLimitedMode(publishedEvent, NOW)).toBe(true);
    expect(
      canEditPadronInLimitedMode(
        { ...publishedEvent, canEditPadronInLimitedMode: false },
        NOW,
      ),
    ).toBe(false);
    expect(
      canEditPadronInLimitedMode(
        { ...publishedEvent, status: "RESULTS_PUBLISHED" },
        NOW,
      ),
    ).toBe(false);
  });

  it("validates each schedule field against the 6h modification window", () => {
    const tooSoon = validateScheduleFieldErrors(
      {
        votingStart: isoAfter(5 * 60 * 60 * 1000),
        votingEnd: isoAfter(7 * 60 * 60 * 1000),
        resultsPublishAt: isoAfter(8 * 60 * 60 * 1000),
      },
      {
        nowMs: NOW,
        minimumStartLeadMs: PRE_PUBLICATION_CUTOFF_MS,
        minimumStartMessage: "Debe respetar 6 horas.",
      },
    );

    expect(tooSoon.votingStart).toBe("Debe respetar 6 horas.");

    const valid = validateScheduleFieldErrors(
      {
        votingStart: isoAfter(7 * 60 * 60 * 1000),
        votingEnd: isoAfter(8 * 60 * 60 * 1000),
        resultsPublishAt: isoAfter(9 * 60 * 60 * 1000),
      },
      {
        nowMs: NOW,
        minimumStartLeadMs: PRE_PUBLICATION_CUTOFF_MS,
        minimumStartMessage: "Debe respetar 6 horas.",
      },
    );

    expect(valid).toEqual({});
  });
});
