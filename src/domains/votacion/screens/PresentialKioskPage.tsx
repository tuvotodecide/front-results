"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import KioskQrSvg from "@/domains/votacion/components/KioskQrSvg";
import {
  normalizeKioskStationId,
} from "@/domains/votacion/kiosk/constants";
import {
  normalizePresentialCurrentState,
  normalizePresentialSessionRotatedEvent,
} from "@/domains/votacion/kiosk/presentialSessionAdapters";
import {
  buildPresentialApiUrl,
  connectPresentialSse,
} from "@/domains/votacion/kiosk/presentialSessionSse";
import {
  clearStoredKioskSession,
  loadStoredKioskSession,
  saveStoredKioskSession,
} from "@/domains/votacion/kiosk/storage";
import {
  useCreatePresentialSessionMutation,
  useGetVotingEventQuery,
  useLazyGetCurrentPresentialSessionQuery,
} from "@/store/votingEvents";
import { selectAuth } from "@/store/auth/authSlice";
import type {
  CreatePresentialSessionResult,
  PresentialCurrentState,
} from "@/store/votingEvents/types";

type ConnectionPhase =
  | "idle"
  | "bootstrapping"
  | "connected"
  | "reconnecting"
  | "error";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const source = error as {
    data?: { message?: string; error?: string };
    error?: string;
    message?: string;
  };

  return (
    source.data?.message ||
    source.data?.error ||
    source.message ||
    source.error ||
    fallback
  );
};

const getFriendlyKioskMessage = (error: unknown, fallback: string) => {
  const rawMessage = getErrorMessage(error, fallback);
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed") ||
    normalized.includes("cors")
  ) {
    return "No se pudo conectar el punto presencial en este momento. Reintenta en unos segundos.";
  }

  if (
    normalized.includes("401") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("token")
  ) {
    return "Este enlace del punto presencial ya no es válido o no tiene autorización para continuar.";
  }

  return fallback;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const describeState = (state: PresentialCurrentState | null) => {
  const status = state?.session?.status;

  if (!state) {
    return {
      title: "Preparando punto presencial",
      tone: "slate",
      description:
        "La pantalla está esperando la sesión inicial para mostrar un QR disponible.",
    };
  }

  if (!state.isEventActive) {
    return {
      title: "La votación aún no está disponible",
      tone: "amber",
      description:
        "Cuando la elección entre en su ventana activa, aquí aparecerá el siguiente QR disponible.",
    };
  }

  if (!state.kioskEnabled || !state.session) {
    return {
      title: "Generando sesión QR",
      tone: "blue",
      description:
        "Estamos preparando el siguiente código para atención presencial.",
    };
  }

  if (status === "CLAIMED") {
    return {
      title: "Votante en proceso",
      tone: "amber",
      description:
        "El código ya fue escaneado. Espera a que el votante termine para mostrar el siguiente QR.",
    };
  }

  if (status === "COMPLETED") {
    return {
      title: "Voto completado",
      tone: "green",
      description:
        "La participación se completó correctamente. En breve se mostrará el siguiente QR.",
    };
  }

  if (status === "EXPIRED") {
    return {
      title: "QR expirado",
      tone: "amber",
      description:
        "El código anterior venció. Estamos esperando el siguiente QR disponible.",
    };
  }

  if (status === "CANCELLED") {
    return {
      title: "Sesión cancelada",
      tone: "red",
      description:
        "La sesión anterior se canceló. Reintentaremos mostrar un nuevo QR disponible.",
    };
  }

  return {
    title: "QR listo para escanear",
    tone: "green",
    description:
      "Pide al votante que escanee el QR con su celular para continuar con el voto asistido.",
  };
};

const toneClasses: Record<string, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
};

const sessionStatusLabels: Record<string, string> = {
  READY: "Lista",
  CLAIMED: "En proceso",
  COMPLETED: "Completada",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

export default function PresentialKioskPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const searchParams = useSearchParams();
  const auth = useSelector(selectAuth);
  const authToken = auth.token;
  const actualElectionId = electionId || "";
  const stationId = normalizeKioskStationId(searchParams.get("stationId"));
  const queryKioskToken = searchParams.get("kioskToken");
  const queryEventName = searchParams.get("eventName");
  const [connectionPhase, setConnectionPhase] =
    useState<ConnectionPhase>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<PresentialCurrentState | null>(
    null,
  );
  const [kioskToken, setKioskToken] = useState<string | null>(
    queryKioskToken,
  );
  const [streamReady, setStreamReady] = useState(false);
  const [storedEventName, setStoredEventName] = useState<string | null>(null);
  const [bootstrapMeta, setBootstrapMeta] =
    useState<CreatePresentialSessionResult | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const reconnectAttemptRef = useRef(0);
  const currentStateRef = useRef<PresentialCurrentState | null>(null);
  const [fetchCurrent] = useLazyGetCurrentPresentialSessionQuery();
  const [createPresentialSession, { isLoading: creatingSession }] =
    useCreatePresentialSessionMutation();
  const { data: event } = useGetVotingEventQuery(actualElectionId, {
    skip: !actualElectionId || !authToken,
  });

  const displayName =
    event?.name ??
    queryEventName ??
    storedEventName ??
    "Punto presencial";

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!actualElectionId) return;

    if (queryKioskToken) {
      setKioskToken(queryKioskToken);
      setStoredEventName(queryEventName);
      saveStoredKioskSession(
        actualElectionId,
        stationId,
        queryKioskToken,
        queryEventName,
      );
      return;
    }

    const stored = loadStoredKioskSession(actualElectionId, stationId);
    if (stored?.kioskToken) {
      setKioskToken(stored.kioskToken);
    }
    if (stored?.eventName) {
      setStoredEventName(stored.eventName);
    }
  }, [actualElectionId, queryEventName, queryKioskToken, stationId]);

  const loadCurrentState = useCallback(
    async (tokenOverride?: string | null) => {
      if (!actualElectionId) return null;

      return fetchCurrent(
        {
          eventId: actualElectionId,
          stationId,
          kioskToken: tokenOverride ?? kioskToken ?? undefined,
        },
      ).unwrap();
    },
    [actualElectionId, fetchCurrent, kioskToken, stationId],
  );

  useEffect(() => {
    if (!actualElectionId) return;

    let cancelled = false;

    const bootstrap = async () => {
      setConnectionPhase("bootstrapping");
      setFeedback(null);
      setStreamReady(false);

      try {
        const tokenCandidate =
          queryKioskToken ??
          kioskToken ??
          loadStoredKioskSession(actualElectionId, stationId)?.kioskToken ??
          null;

        if (tokenCandidate) {
          try {
            const state = await loadCurrentState(tokenCandidate);
            if (cancelled) return;
            setCurrentState(state);
            setKioskToken(tokenCandidate);
            setConnectionPhase("connected");
            setStreamReady(true);
            return;
          } catch (error) {
            clearStoredKioskSession(actualElectionId, stationId);
            if (!authToken) {
              throw error;
            }
          }
        }

        if (!authToken) {
          setConnectionPhase("error");
          setFeedback(
            "Este punto presencial debe abrirse desde una cuenta autorizada o con el enlace generado para kiosco.",
          );
          return;
        }

        const current = await loadCurrentState(null);
        if (cancelled) return;

        if (current && (current.kioskEnabled || current.session)) {
          setCurrentState(current);
          setConnectionPhase("connected");
          setStreamReady(true);
          return;
        }

        const created = await createPresentialSession({
          eventId: actualElectionId,
          data: { stationId },
        }).unwrap();
        if (cancelled) return;

        setBootstrapMeta(created);
        if (created.kioskAccessToken) {
          setKioskToken(created.kioskAccessToken);
          saveStoredKioskSession(
            actualElectionId,
            stationId,
            created.kioskAccessToken,
            displayName,
          );
        }

        setCurrentState({
          eventId: created.eventId,
          stationId: created.stationId,
          kioskEnabled: created.kioskEnabled,
          eventState: current?.eventState ?? event?.state ?? "",
          isEventActive: current?.isEventActive ?? false,
          session: created.currentSession,
        });
        setConnectionPhase("connected");
        setStreamReady(true);
      } catch (error) {
        if (cancelled) return;
        setConnectionPhase("error");
        setStreamReady(false);
        setFeedback(
          getFriendlyKioskMessage(
            error,
            "No se pudo inicializar el punto presencial de esta elección.",
          ),
        );
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    actualElectionId,
    authToken,
    createPresentialSession,
    displayName,
    event?.state,
    kioskToken,
    loadCurrentState,
    queryKioskToken,
    stationId,
  ]);

  useEffect(() => {
    if (!actualElectionId || !streamReady) {
      return;
    }

    if (!kioskToken && !authToken) {
      return;
    }

    const streamPath =
      bootstrapMeta?.kioskBootstrap.streamPath ||
      `/api/v1/voting/events/${actualElectionId}/presential-sessions/stream?stationId=${encodeURIComponent(
        stationId,
      )}`;

    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;

    const scheduleReconnect = (message?: string) => {
      if (disposed) return;

      reconnectAttemptRef.current += 1;
      setConnectionPhase("reconnecting");
      if (message) {
        setFeedback(message);
      }

      const delay = Math.min(8000, 1000 * 2 ** reconnectAttemptRef.current);
      reconnectTimer = setTimeout(async () => {
        if (disposed) return;

        try {
          const refreshed = await loadCurrentState();
          if (!disposed && refreshed) {
            setCurrentState(refreshed);
          }
        } catch {
          // Ignore refresh errors while reconnection keeps trying.
        }

        void connect();
      }, delay);
    };

    const connect = async () => {
      if (disposed) return;

      activeController = new AbortController();

      try {
        await connectPresentialSse({
          url: buildPresentialApiUrl(streamPath),
          kioskToken,
          bearerToken: kioskToken ? null : authToken,
          signal: activeController.signal,
          onOpen: () => {
            reconnectAttemptRef.current = 0;
            setConnectionPhase("connected");
            setFeedback(null);
          },
          onEvent: ({ event: eventName, data }) => {
            if (eventName === "session.rotated") {
              const rotated = normalizePresentialSessionRotatedEvent(data);
              setCurrentState((previous) => ({
                eventId: rotated.eventId || previous?.eventId || actualElectionId,
                stationId: rotated.stationId || previous?.stationId || stationId,
                kioskEnabled: previous?.kioskEnabled ?? true,
                eventState: previous?.eventState ?? "",
                isEventActive: previous?.isEventActive ?? true,
                session: rotated.session,
              }));
              return;
            }

            setCurrentState(normalizePresentialCurrentState(data));
          },
        });

        if (!disposed) {
          scheduleReconnect("La conexión se interrumpió. Reintentando automáticamente…");
        }
      } catch (error) {
        if (disposed) return;
        scheduleReconnect(
          getFriendlyKioskMessage(
            error,
            "Se perdió la conexión del punto presencial.",
          ),
        );
      }
    };

    void connect();

    return () => {
      disposed = true;
      activeController?.abort();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [
    actualElectionId,
    authToken,
    bootstrapMeta?.kioskBootstrap.streamPath,
    kioskToken,
    loadCurrentState,
    stationId,
    streamReady,
  ]);

  const stateCopy = describeState(currentState);
  const expiresAt = parseDate(currentState?.session?.expiresAt);
  const secondsLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - nowMs) / 1000))
    : null;
  const showQr =
    currentState?.session?.status === "READY" &&
    Boolean(currentState.session.qrValue);

  const handleRetry = async () => {
    setFeedback(null);
    setConnectionPhase("bootstrapping");
    setStreamReady(false);

    try {
      const refreshed = await loadCurrentState();
      if (refreshed) {
        setCurrentState(refreshed);
        setConnectionPhase("connected");
        setStreamReady(true);
        return;
      }
    } catch {
      // Fall back to create below.
    }

    if (!authToken || !actualElectionId) {
      setConnectionPhase("error");
      setFeedback("No hay una sesión autorizada para recrear este punto presencial.");
      return;
    }

    try {
      const created = await createPresentialSession({
        eventId: actualElectionId,
        data: { stationId },
      }).unwrap();

      setBootstrapMeta(created);
      if (created.kioskAccessToken) {
        setKioskToken(created.kioskAccessToken);
        saveStoredKioskSession(
          actualElectionId,
          stationId,
          created.kioskAccessToken,
          displayName,
        );
      }

      setCurrentState({
        eventId: created.eventId,
        stationId: created.stationId,
        kioskEnabled: created.kioskEnabled,
        eventState: currentStateRef.current?.eventState ?? "",
        isEventActive: currentStateRef.current?.isEventActive ?? false,
        session: created.currentSession,
      });
      setConnectionPhase("connected");
      setStreamReady(true);
    } catch (error) {
      setConnectionPhase("error");
      setStreamReady(false);
      setFeedback(
        getFriendlyKioskMessage(
          error,
          "No se pudo generar un nuevo QR para el punto presencial.",
        ),
      );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8f8ee_0%,_#f8fafc_38%,_#e2e8f0_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
        <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2F8A46]">
              Punto presencial
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {displayName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Pantalla de atención presencial para que el votante escanee el código y continúe el proceso desde su celular.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Estado de la pantalla
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {connectionPhase === "connected"
                  ? "Lista"
                  : connectionPhase === "reconnecting"
                    ? "Reconectando"
                    : connectionPhase === "bootstrapping"
                      ? "Preparando"
                      : connectionPhase === "error"
                        ? "Requiere atención"
                        : "En espera"}
              </p>
            </div>

          </div>
        </header>

        {feedback ? (
          <div className="border-b border-slate-200 px-6 py-4">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                connectionPhase === "error"
                  ? toneClasses.red
                  : connectionPhase === "reconnecting"
                    ? toneClasses.amber
                    : toneClasses.blue
              }`}
            >
              {feedback}
            </div>
          </div>
        ) : null}

        <div className="grid flex-1 gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="flex min-h-[460px] flex-col rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ecfdf5_100%)] p-6 shadow-sm">
            <div
              className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                toneClasses[stateCopy.tone] || toneClasses.slate
              }`}
            >
              {stateCopy.title}
            </div>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {stateCopy.description}
            </p>

            <div className="mt-8 flex flex-1 items-center justify-center">
              {showQr && currentState?.session?.qrValue ? (
                <div className="rounded-[2rem] border border-[#2F8A46]/15 bg-white p-6 shadow-[0_20px_60px_rgba(22,101,52,0.14)]">
                  <KioskQrSvg
                    value={currentState.session.qrValue}
                    size={360}
                    className="h-[320px] w-[320px] sm:h-[360px] sm:w-[360px]"
                  />
                </div>
              ) : connectionPhase === "bootstrapping" || creatingSession ? (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-[6px] border-[#2F8A46] border-t-transparent" />
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">
                      Generando sesión QR
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Estamos preparando el código para el siguiente votante.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex max-w-md flex-col items-center gap-4 rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-8 py-10 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl">
                    {currentState?.session?.status === "COMPLETED"
                      ? "✓"
                      : currentState?.session?.status === "EXPIRED"
                        ? "!"
                        : currentState?.session?.status === "CLAIMED"
                          ? "…"
                          : "⧉"}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">
                      {stateCopy.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {stateCopy.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[#2F8A46]/15 bg-white/90 px-5 py-4 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                Indicación para el votante
              </p>
              <p className="mt-2">
                Escanea este QR con tu celular y sigue los pasos del voto asistido. Mantén esta pantalla abierta mientras se completa la atención.
              </p>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Estado actual
              </p>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-4">
                  <span>Sesión</span>
                  <span className="font-semibold text-slate-900">
                    {currentState?.session?.status
                      ? sessionStatusLabels[currentState.session.status] ??
                        currentState.session.status
                      : "Sin sesión"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span>Tiempo restante</span>
                  <span className="font-semibold text-slate-900">
                    {secondsLeft !== null ? `${secondsLeft}s` : "Esperando nuevo QR"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span>Código visible</span>
                  <span className="font-semibold text-slate-900">
                    {showQr ? "Visible" : "Oculto"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Acciones
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Si el código no aparece o la pantalla perdió conexión, puedes generar nuevamente el QR desde aquí.
              </p>
              <button
                type="button"
                onClick={() => void handleRetry()}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#2F8A46] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256f39]"
              >
                Reintentar generar QR
              </button>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                La pantalla actualizará automáticamente el código cuando quede disponible uno nuevo.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
