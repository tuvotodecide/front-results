import {
  THIRTY_SIX_HOURS_MS,
  TWENTY_FOUR_HOURS_MS,
  canEditElectionBeforeCutoff,
  canEditPadronInLimitedMode,
  getPublishDeadlineMs,
  isAfterPublishCutoffBeforeVoting,
} from "@/features/electionConfig/renderUtils";

const NOW = new Date("2026-04-17T12:00:00.000Z").getTime();
const isoAfter = (ms: number) => new Date(NOW + ms).toISOString();

describe("election render rules", () => {
  it("keeps full edition only before official publication and before the 24h publication limit", () => {
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

  it("uses the real 24h publication limit separately from the 36h form validation constant", () => {
    const event = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(48 * 60 * 60 * 1000),
    };

    expect(THIRTY_SIX_HOURS_MS).toBe(36 * 60 * 60 * 1000);
    expect(TWENTY_FOUR_HOURS_MS).toBe(24 * 60 * 60 * 1000);
    expect(getPublishDeadlineMs(event)).toBe(
      new Date(event.votingStart).getTime() - TWENTY_FOUR_HOURS_MS,
    );
  });

  it("detects the read-only period after the publication limit and before voting", () => {
    const event = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(12 * 60 * 60 * 1000),
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
});
