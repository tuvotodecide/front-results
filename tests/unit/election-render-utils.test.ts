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
  it("keeps full edition only before official publication and before the publication limit", () => {
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

  it("uses the 0h publication limit and the 1h create validation constants", () => {
    const event = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(48 * 60 * 60 * 1000),
    };

    expect(MIN_CREATE_LEAD_MS).toBe(1 * 60 * 60 * 1000);
    expect(PRE_PUBLICATION_CUTOFF_MS).toBe(0);
    // Sin ventana previa, el límite de publicación coincide con el inicio de la votación.
    expect(getPublishDeadlineMs(event)).toBe(
      new Date(event.votingStart).getTime(),
    );
  });

  it("detects the read-only period after the publication limit and before voting", () => {
    // Con el límite en 0h sólo un publishDeadline explícito del backend abre el periodo de sólo lectura.
    const afterExplicitDeadline = {
      status: "READY_FOR_REVIEW",
      publishDeadline: isoAfter(-60 * 60 * 1000),
      votingStart: isoAfter(5 * 60 * 60 * 1000),
      votingEnd: isoAfter(36 * 60 * 60 * 1000),
    };

    expect(isAfterPublishCutoffBeforeVoting(afterExplicitDeadline, NOW)).toBe(
      true,
    );

    const stillEditableUntilVotingStart = {
      status: "READY_FOR_REVIEW",
      votingStart: isoAfter(1 * 60 * 60 * 1000),
      votingEnd: isoAfter(36 * 60 * 60 * 1000),
    };

    expect(
      isAfterPublishCutoffBeforeVoting(stillEditableUntilVotingStart, NOW),
    ).toBe(false);
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

  it("validates each schedule field against the modification window", () => {
    // Ventana de modificación (0h): sólo se rechaza un inicio ya pasado.
    const alreadyStarted = validateScheduleFieldErrors(
      {
        votingStart: isoAfter(-60 * 1000),
        votingEnd: isoAfter(2 * 60 * 60 * 1000),
        resultsPublishAt: isoAfter(3 * 60 * 60 * 1000),
      },
      {
        nowMs: NOW,
        minimumStartLeadMs: PRE_PUBLICATION_CUTOFF_MS,
        minimumStartMessage: "El inicio no puede estar en el pasado.",
      },
    );

    expect(alreadyStarted.votingStart).toBe(
      "El inicio no puede estar en el pasado.",
    );

    const valid = validateScheduleFieldErrors(
      {
        votingStart: isoAfter(1 * 60 * 60 * 1000),
        votingEnd: isoAfter(2 * 60 * 60 * 1000),
        resultsPublishAt: isoAfter(3 * 60 * 60 * 1000),
      },
      {
        nowMs: NOW,
        minimumStartLeadMs: PRE_PUBLICATION_CUTOFF_MS,
        minimumStartMessage: "El inicio no puede estar en el pasado.",
      },
    );

    expect(valid).toEqual({});

    // Ventana de creación (1h): un inicio a 30 minutos sigue siendo inválido.
    const tooSoonToCreate = validateScheduleFieldErrors(
      {
        votingStart: isoAfter(30 * 60 * 1000),
        votingEnd: isoAfter(2 * 60 * 60 * 1000),
        resultsPublishAt: isoAfter(3 * 60 * 60 * 1000),
      },
      {
        nowMs: NOW,
        minimumStartLeadMs: MIN_CREATE_LEAD_MS,
        minimumStartMessage: "Debe respetar 1 hora.",
      },
    );

    expect(tooSoonToCreate.votingStart).toBe("Debe respetar 1 hora.");
  });
});
