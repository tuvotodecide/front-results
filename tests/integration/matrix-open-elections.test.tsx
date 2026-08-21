import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateElectionWizard from "@/features/elections/components/CreateElectionWizard";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigateMock = vi.fn();
const createVotingEventMock = vi.fn();
const route = { electionId: "evt-1" };

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => route,
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual = await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
    "@/features/electionConfig/renderUtils",
  );
  return { ...actual, useClientNow: () => new Date("2026-04-17T12:00:00.000Z").getTime() };
});

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title ?? "Modal"}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

vi.mock("@/store/votingEvents", () => ({
  useCreateVotingEventMutation: vi.fn(),
  useAddPadronStagingEntryMutation: vi.fn(),
  useAnalyzePadronWithGeminiMutation: vi.fn(),
  useBulkDeletePadronStagingEntriesMutation: vi.fn(),
  useConfirmPadronStagingMutation: vi.fn(),
  useDeletePadronStagingEntryMutation: vi.fn(),
  useEnableCurrentPadronVoterMutation: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetEventReviewReadinessQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetPadronStagingQuery: vi.fn(),
  useGetPadronVotersQuery: vi.fn(),
  useGetPadronWorkflowSummaryQuery: vi.fn(),
  useGetVotingEventQuery: vi.fn(),
  useLazyDownloadPadronPdfQuery: vi.fn(),
  useLazyGetPadronImportStatusQuery: vi.fn(),
  useLazyGetPadronStagingQuery: vi.fn(),
  useUpdatePadronStagingEntryMutation: vi.fn(),
  useUploadPadronSourceMutation: vi.fn(),
}));

const estimateCapacityMock = vi.fn();

vi.mock("@/store/tvd", () => ({
  useEstimateMyTvdCapacityMutation: () => [estimateCapacityMock, { isLoading: false }],
}));

vi.mock("@/features/adminTvd/data/useTvdPerCredit", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/adminTvd/data/useTvdPerCredit")
  >("@/features/adminTvd/data/useTvdPerCredit");
  return {
    ...actual,
    fetchTvdPerCredit: vi.fn().mockResolvedValue({
      raw: "1000000000000000000",
      decimals: 18,
      formatted: "1 TVD",
    }),
  };
});

import * as votingEvents from "@/store/votingEvents";

const sufficientCapacity = (participants: string) => ({
  unwrap: vi.fn().mockResolvedValue({
    estimatedParticipants: participants,
    estimatedRequiredTokens: participants,
    availableTokens: "1000",
    availableSmallestUnit: "1000000000000000000000",
    estimatedMissingTokens: "0",
    hasEstimatedCapacity: true,
    reasonCode: null,
  }),
});

const activeTenantContext = {
  active: true,
  role: "TENANT_ADMIN",
  tenantId: "tenant-1",
  user: { id: "admin-1", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1" } as any,
  activeContext: { type: "TENANT", role: "TENANT_ADMIN", tenantId: "tenant-1", label: "Institución" } as any,
};

function renderWizard(authState: Record<string, unknown> = activeTenantContext) {
  return renderWithAuthStore(<CreateElectionWizard />, authState as any);
}

async function fillGeneralData(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿A qué institución pertenece?"), "Elección abierta");
  await user.type(
    screen.getByLabelText("¿Cuál es el objetivo o descripción?"),
    "Elegir representantes institucionales",
  );
  const maxOpenVotersInput = screen.queryByLabelText("¿Cuántos votantes pueden participar?");
  if (maxOpenVotersInput) {
    await user.type(maxOpenVotersInput, "10");
  }
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
}

async function fillScheduleAndCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("¿Cuándo abre la votación?"), "2027-06-01T12:00");
  await user.type(screen.getByLabelText("¿Cuándo cierra la votación?"), "2027-06-01T18:00");
  await user.type(
    screen.getByLabelText("¿Cuándo se muestran los resultados?"),
    "2027-06-01T19:00",
  );
  await user.click(screen.getByRole("button", { name: "CREAR" }));
  await user.click(await screen.findByRole("button", { name: "Confirmar" }));
}

describe("votación abierta | integración con el repositorio de elecciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createVotingEventMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        id: "evt-open",
        name: "Elección abierta",
        objective: "Elegir representantes institucionales",
        isReferendum: false,
        isOpenVoting: true,
        votingStart: "2027-06-01T12:00:00.000Z",
        votingEnd: "2027-06-01T18:00:00.000Z",
        resultsPublishAt: "2027-06-01T19:00:00.000Z",
        createdAt: "2026-04-17T12:00:00.000Z",
      }),
    });
    vi.mocked(votingEvents.useCreateVotingEventMutation).mockReturnValue([
      createVotingEventMock,
      { isLoading: false },
    ] as any);
    estimateCapacityMock.mockReturnValue(sufficientCapacity("10"));
  });

  it("EA-P0-02-001 envía isOpenVoting en true junto al tenant activo a la mutación real", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    await waitFor(() => {
      expect(createVotingEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", isOpenVoting: true }),
      );
    });
  });

  it("EA-P0-02-002 envía isOpenVoting en false cuando no se activa la opción", async () => {
    const user = userEvent.setup();
    renderWizard();

    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    await waitFor(() => {
      expect(createVotingEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", isOpenVoting: false }),
      );
    });
  });

  it("EA-P0-02-003 navega a la configuración de cargos tras crear la votación abierta", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
    await fillGeneralData(user);
    await fillScheduleAndCreate(user);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/votacion/elecciones/evt-open/config/cargos",
        { replace: true },
      );
    });
  });

  it("EA-P0-02-004 bloquea la creación de la votación abierta sin institución activa", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      renderWizard({ active: true, role: "TENANT_ADMIN", tenantId: null, user: null, activeContext: null });

      await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
      await fillGeneralData(user);

      // Sin institución activa no se puede cotizar el límite de votantes en TVD,
      // así que el wizard se detiene en el paso de datos generales.
      expect(
        await screen.findByText(
          "No se encontró un contexto institucional activo. Selecciona tu institución para crear votaciones.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText("¿Cuándo abre la votación?")).not.toBeInTheDocument();
      expect(estimateCapacityMock).not.toHaveBeenCalled();
      expect(createVotingEventMock).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("EA-P0-02-005 conserva la votación abierta activada tras un error de creación", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createVotingEventMock.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error("El nombre de la votación ya existe.")),
    });
    try {
      renderWizard();

      await user.click(screen.getByRole("switch", { name: "¿Es votación abierta?" }));
      await fillGeneralData(user);
      await fillScheduleAndCreate(user);

      expect(await screen.findByText("El nombre de la votación ya existe.")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Anterior" }));
      expect(
        screen.getByRole("switch", { name: "¿Es votación abierta?" }),
      ).toHaveAttribute("aria-checked", "true");
    } finally {
      errorSpy.mockRestore();
    }
  });
});
