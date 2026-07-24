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
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

const getFetchRequest = () => vi.mocked(fetch).mock.calls[0]?.[0] as Request;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("official publication admin API", () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates or recovers an official publication request with only eventId in the path", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        created: true,
        request: {
          requestId: "opr-1",
          eventId: "evt-1",
          status: "PENDING_APPROVAL",
          votersCount: "10",
          requiredCredits: "10",
          requiredTvd: "10000000000000000000",
          tvdPerCredit: "1000000000000000000",
          signerWallet: "0xabc",
          expiresAt: "2026-06-01T06:00:00.000Z",
          createdAt: "2026-05-31T10:00:00.000Z",
          updatedAt: "2026-05-31T10:00:00.000Z",
        },
      }),
    );
    const store = createApiStore();

    const result = await store.dispatch(
      votingEventsEndpoints.endpoints.createOfficialPublicationRequest.initiate({
        eventId: "evt-1",
      }),
    );

    const request = getFetchRequest();
    expect(request.url).toContain(
      "/api/v1/voting/events/evt-1/official-publication/requests",
    );
    expect(request.method).toBe("POST");
    const body = await request.json();
    expect(body).toEqual({});
    expect(JSON.stringify(body)).not.toContain("institutionId");
    expect(JSON.stringify(body)).not.toContain("callData");
    expect(result.data?.created).toBe(true);
    expect(result.data?.request?.requestId).toBe("opr-1");
  });

  it("consults the active request and supports request:null", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ request: null }));
    const store = createApiStore();

    const result = await store.dispatch(
      votingEventsEndpoints.endpoints.getActiveOfficialPublicationRequest.initiate(
        "evt-1",
      ),
    );

    const request = getFetchRequest();
    expect(request.url).toContain(
      "/api/v1/voting/events/evt-1/official-publication/requests/active",
    );
    expect(request.method).toBe("GET");
    expect(result.data?.request).toBeNull();
  });

  it("accepts created:false when another tab already created the active request", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        created: false,
        request: {
          requestId: "opr-existing",
          eventId: "evt-1",
          status: "PENDING_APPROVAL",
        },
      }),
    );
    const store = createApiStore();

    const result = await store.dispatch(
      votingEventsEndpoints.endpoints.createOfficialPublicationRequest.initiate({
        eventId: "evt-1",
      }),
    );

    expect(result.data?.created).toBe(false);
    expect(result.data?.request?.requestId).toBe("opr-existing");
  });

  it("consults by requestId and cancels with a safe reason code", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ request: { requestId: "opr-1", eventId: "evt-1", status: "CLAIMED" } }))
      .mockResolvedValueOnce(jsonResponse({ request: { requestId: "opr-1", eventId: "evt-1", status: "CANCELLED" } }))
      .mockResolvedValueOnce(jsonResponse({ request: { requestId: "opr-1", eventId: "evt-1", status: "CANCELLED" } }));
    const store = createApiStore();

    await store.dispatch(
      votingEventsEndpoints.endpoints.getOfficialPublicationRequest.initiate(
        "opr-1",
      ),
    );
    await store.dispatch(
      votingEventsEndpoints.endpoints.cancelOfficialPublicationRequest.initiate({
        requestId: "opr-1",
      }),
    );

    const getRequest = vi.mocked(fetch).mock.calls[0]?.[0] as Request;
    const cancelRequest = vi.mocked(fetch).mock.calls[1]?.[0] as Request;
    expect(getRequest.url).toContain(
      "/api/v1/voting/official-publication/requests/opr-1",
    );
    expect(getRequest.method).toBe("GET");
    expect(cancelRequest.url).toContain(
      "/api/v1/voting/official-publication/requests/opr-1/cancel",
    );
    expect(cancelRequest.method).toBe("POST");
    await expect(cancelRequest.json()).resolves.toEqual({
      reasonCode: "USER_CANCELLED",
    });
  });

  it("surfaces 422, 409 and 410 as API errors without fabricating requests", async () => {
    for (const status of [422, 409, 410]) {
      vi.mocked(fetch).mockResolvedValueOnce(
        jsonResponse({ code: "OFFICIAL_PUBLICATION_ERROR" }, status),
      );
    }
    const store = createApiStore();

    const preflight = await store.dispatch(
      votingEventsEndpoints.endpoints.createOfficialPublicationRequest.initiate({
        eventId: "evt-422",
      }),
    );
    const conflict = await store.dispatch(
      votingEventsEndpoints.endpoints.cancelOfficialPublicationRequest.initiate({
        requestId: "opr-409",
      }),
    );
    const expired = await store.dispatch(
      votingEventsEndpoints.endpoints.createOfficialPublicationRequest.initiate({
        eventId: "evt-410",
      }),
    );

    expect(preflight.error).toBeTruthy();
    expect(conflict.error).toBeTruthy();
    expect(expired.error).toBeTruthy();
    expect(preflight.data).toBeUndefined();
    expect(conflict.data).toBeUndefined();
    expect(expired.data).toBeUndefined();
  });
});
