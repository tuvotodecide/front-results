import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiSlice } from "@/store/apiSlice";
import { votingEventsEndpoints } from "@/store/votingEvents/votingEventsEndpoints";

const NativeRequest = globalThis.Request;

const createApiStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: () => ({ token: "token" }),
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });

const getFetchCall = () => {
  const call = vi.mocked(fetch).mock.calls[0];
  const request = call?.[0] as Request;
  return request;
};

describe("participation analytics votingEvents API", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Request",
      class RequestWithoutSignalMismatch extends NativeRequest {
        constructor(input: RequestInfo | URL, init?: RequestInit) {
          super(input, init ? { ...init, signal: undefined } : init);
        }
      },
    );
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:participation-report"),
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("getParticipationAnalytics usa GET contra la ruta esperada", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          votingId: "evt-1",
          votingName: "Elección",
          institutionName: "Institución",
          status: "IN_PROGRESS",
          publishedAt: null,
          totalEnabled: 10,
          totalParticipated: 7,
          totalPending: 3,
          participationPercentage: 70,
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
    const store = createApiStore();

    const result = await store.dispatch(
      votingEventsEndpoints.endpoints.getParticipationAnalytics.initiate("evt-1"),
    );

    const request = getFetchCall();
    expect(request.url).toContain("/api/v1/voting/events/evt-1/participation-analytics");
    expect(request.method).toBe("GET");
    expect(result.data?.participationPercentage).toBe(70);
  });

  it("downloadParticipationReportWithScreenshot usa POST, envía modalScreenshot y usa filename del header", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(["pdf"], { type: "application/pdf" }), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="participation-report-evt-1.pdf"',
        },
      }),
    );
    const store = createApiStore();

    const result = await store.dispatch(
      votingEventsEndpoints.endpoints.downloadParticipationReportWithScreenshot.initiate({
        eventId: "evt-1",
        modalScreenshot: "data:image/png;base64,modal",
      }),
    );

    const request = getFetchCall();
    expect(request.url).toContain("/api/v1/voting/events/evt-1/participation-report");
    expect(request.method).toBe("POST");
    await expect(request.json()).resolves.toEqual({
      modalScreenshot: "data:image/png;base64,modal",
    });
    expect(result.data).toEqual({
      ok: true,
      fileName: "participation-report-evt-1.pdf",
    });
    expect((result.data as any)?.blob).toBeUndefined();
    expect(result.data?.fileName).toBe("participation-report-evt-1.pdf");
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    const downloadedBlob = vi.mocked(window.URL.createObjectURL).mock.calls[0]?.[0] as Blob;
    expect(downloadedBlob.type).toBe("application/pdf");
    expect(downloadedBlob.size).toBeGreaterThan(0);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:participation-report");
    const consoleOutput = [
      ...consoleErrorSpy.mock.calls.flat(),
      ...consoleWarnSpy.mock.calls.flat(),
    ].join(" ");
    expect(consoleOutput).not.toContain("non-serializable");
  });

  it("downloadParticipationReportWithScreenshot usa filename fallback si no hay Content-Disposition", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(["pdf"], { type: "application/pdf" }), {
        headers: { "content-type": "application/pdf" },
      }),
    );
    const store = createApiStore();

    const result = await store.dispatch(
      votingEventsEndpoints.endpoints.downloadParticipationReportWithScreenshot.initiate({
        eventId: "evt-fallback",
        modalScreenshot: "data:image/png;base64,modal",
      }),
    );

    expect(result.data?.fileName).toBe("participation-report-evt-fallback.pdf");
  });
});
