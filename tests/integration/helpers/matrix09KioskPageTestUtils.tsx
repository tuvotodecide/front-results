import { render } from "@testing-library/react";
import { vi } from "vitest";

type KioskState = {
  eventId: string;
  stationId: string;
  kioskEnabled: boolean;
  eventState: string;
  isEventActive: boolean;
  session: {
    id: string;
    eventId: string;
    stationId: string;
    status: string;
    rotationNumber: number;
    expiresAt: string;
    qrValue: string | null;
  };
};

type KioskSseCall = {
  onEvent: (event: { event: string; data: unknown }) => void;
  signal: AbortSignal;
  kioskToken?: string | null;
};

function isKioskSseCall(value: unknown): value is KioskSseCall {
  return Boolean(
    value &&
      typeof value === "object" &&
      "onEvent" in value &&
      typeof value.onEvent === "function",
  );
}

type KioskPageMocks = {
  authToken: string | null;
  createSession: ReturnType<typeof vi.fn>;
  currentState: KioskState | null;
  fetchCurrent: ReturnType<typeof vi.fn>;
  loadingEvent: boolean;
  searchParams: URLSearchParams;
  sseCalls: KioskSseCall[];
  connectSse: ReturnType<typeof vi.fn>;
  event: {
    id: string;
    name: string;
    state: string;
    status: string;
    presentialKioskEnabled: boolean;
  };
};

const kioskPageMocksState = vi.hoisted((): KioskPageMocks => ({
  authToken: "admin-session-token",
  createSession: vi.fn(),
  currentState: null,
  fetchCurrent: vi.fn(),
  loadingEvent: false,
  searchParams: new URLSearchParams(),
  sseCalls: [],
  connectSse: vi.fn(),
  event: {
    id: "eleccion-09",
    name: "Elección presencial",
    state: "ACTIVE",
    status: "ACTIVE",
    presentialKioskEnabled: true,
  },
}));

export const kioskPageMocks = kioskPageMocksState;

vi.mock("next/navigation", () => ({
  useParams: () => ({ electionId: "eleccion-09" }),
  useSearchParams: () => kioskPageMocks.searchParams,
}));

vi.mock("react-redux", () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

vi.mock("@/store/auth/authSlice", () => ({
  selectAuth: () => ({ token: kioskPageMocks.authToken }),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: () => ({
    data: kioskPageMocks.event,
    isLoading: kioskPageMocks.loadingEvent,
  }),
  useLazyGetCurrentPresentialSessionQuery: () => [kioskPageMocks.fetchCurrent],
  useCreatePresentialSessionMutation: () => [
    kioskPageMocks.createSession,
    { isLoading: false },
  ],
}));

vi.mock("@/domains/votacion/kiosk/presentialSessionSse", async () => {
  const actual = await vi.importActual<
    typeof import("@/domains/votacion/kiosk/presentialSessionSse")
  >("@/domains/votacion/kiosk/presentialSessionSse");

  return {
    ...actual,
    connectPresentialSse: (options: unknown) => {
      if (isKioskSseCall(options)) {
        kioskPageMocks.sseCalls.push(options);
      }
      return kioskPageMocks.connectSse(options);
    },
  };
});

import PresentialKioskPage from "@/domains/votacion/screens/PresentialKioskPage";

export const makeKioskState = (
  status = "READY",
  options: {
    isEventActive?: boolean;
    kioskEnabled?: boolean;
    qrValue?: string | null;
    stationId?: string;
  } = {},
) => ({
  eventId: "eleccion-09",
  stationId: options.stationId ?? "kiosco-principal",
  kioskEnabled: options.kioskEnabled ?? true,
  eventState: options.isEventActive === false ? "OFFICIALLY_PUBLISHED" : "ACTIVE",
  isEventActive: options.isEventActive ?? true,
  session: {
    id: `sesion-${status.toLowerCase()}`,
    eventId: "eleccion-09",
    stationId: options.stationId ?? "kiosco-principal",
    status,
    rotationNumber: 1,
    expiresAt: "2030-01-01T00:05:00.000Z",
    qrValue:
      options.qrValue === undefined
        ? status === "READY"
          ? "pqs.sesion-09.token-09"
          : null
        : options.qrValue,
  },
});

const createResult = (state: ReturnType<typeof makeKioskState>) => ({
  eventId: state.eventId,
  stationId: state.stationId,
  kioskEnabled: state.kioskEnabled,
  kioskAccessToken: "generated-kiosk-token",
  kioskBootstrap: {
    authHeader: "x-kiosk-token",
    currentPath: "/api/v1/voting/events/eleccion-09/presential-sessions/current",
    streamPath: "/api/v1/voting/events/eleccion-09/presential-sessions/stream",
  },
  currentSession: state.session,
  readyTtlSeconds: 300,
  claimTtlSeconds: 600,
});

export const resetKioskPageMocks = () => {
  vi.clearAllMocks();
  window.localStorage.clear();
  kioskPageMocks.authToken = "admin-session-token";
  kioskPageMocks.currentState = makeKioskState();
  kioskPageMocks.loadingEvent = false;
  kioskPageMocks.searchParams = new URLSearchParams();
  kioskPageMocks.sseCalls = [];
  kioskPageMocks.event = {
    id: "eleccion-09",
    name: "Elección presencial",
    state: "ACTIVE",
    status: "ACTIVE",
    presentialKioskEnabled: true,
  };
  kioskPageMocks.fetchCurrent.mockImplementation(() => ({
    unwrap: () => Promise.resolve(kioskPageMocks.currentState),
  }));
  kioskPageMocks.createSession.mockImplementation(() => ({
    unwrap: () => Promise.resolve(createResult(kioskPageMocks.currentState ?? makeKioskState())),
  }));
  kioskPageMocks.connectSse.mockImplementation(
    () => new Promise<void>(() => undefined),
  );
};

export const renderKioskPage = () => render(<PresentialKioskPage />);
