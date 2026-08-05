import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PadronCheckModal from "@/features/padronCheck/PadronCheckModal";
import { jsonResponse } from "../fixtures/matrix-13-public";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MX-13 | soporte de consulta pública de padrón", () => {
  it("[MX-13][SOPORTE-PADRON][ACEPTACION] permite a un visitante verificar un carnet válido y comunica los estados habilitado y no habilitado sin exponer el padrón", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({
        status: "ELIGIBLE",
        referenceVersion: "publica-v1",
        fullRoll: ["dato que no debe mostrarse"],
        unrelatedPerson: "identidad ajena",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<PadronCheckModal isOpen onClose={vi.fn()} eventId="evt-publico" />);

    const dialog = screen.getByRole("dialog", { name: "Consulta tu estado en el Padrón" });
    await user.type(within(dialog).getByLabelText("Carnet de Identidad"), "1234567");
    await user.click(within(dialog).getByRole("button", { name: "Verificar" }));

    expect(await within(dialog).findByRole("heading", { name: "HABILITADO" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const eligibleCall = fetchMock.mock.calls[0];
    if (!eligibleCall) throw new Error("fetch no fue invocado");
    const [eligibleRequest, eligibleInit] = eligibleCall;
    const eligibleUrl = new URL(String(eligibleRequest));
    expect(eligibleUrl.pathname).toBe("/api/v1/voting/events/evt-publico/eligibility/public");
    expect(eligibleUrl.searchParams.get("carnet")).toBe("1234567");
    expect(eligibleInit).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    expect(screen.queryByText("dato que no debe mostrarse")).not.toBeInTheDocument();
    expect(screen.queryByText("identidad ajena")).not.toBeInTheDocument();

    cleanup();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "NOT_ELIGIBLE" })));
    render(<PadronCheckModal isOpen onClose={vi.fn()} eventId="evt-publico" />);
    const unavailableDialog = screen.getByRole("dialog", { name: "Consulta tu estado en el Padrón" });
    await user.type(within(unavailableDialog).getByLabelText("Carnet de Identidad"), "7654321");
    await user.click(within(unavailableDialog).getByRole("button", { name: "Verificar" }));
    expect(await within(unavailableDialog).findByRole("heading", { name: "NO HABILITADO" })).toBeInTheDocument();
  });

  it("[MX-13][SOPORTE-PADRON][ACEPTACION] informa consulta pública deshabilitada sin sesión administrativa ni datos de otra identidad", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({
        status: "PUBLIC_CHECK_DISABLED",
        internalReason: "configuración privada",
        administrators: [{ email: "admin@private.test" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<PadronCheckModal isOpen onClose={vi.fn()} eventId="evt-sin-consulta" />);

    const dialog = screen.getByRole("dialog", { name: "Consulta tu estado en el Padrón" });
    await user.type(within(dialog).getByLabelText("Carnet de Identidad"), "1234567");
    await user.click(within(dialog).getByRole("button", { name: "Verificar" }));

    expect(
      await within(dialog).findByRole("heading", { name: "CONSULTA DESHABILITADA" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const disabledCall = fetchMock.mock.calls[0];
    if (!disabledCall) throw new Error("fetch no fue invocado");
    const [disabledRequest, disabledInit] = disabledCall;
    const disabledUrl = new URL(String(disabledRequest));
    expect(disabledUrl.pathname).toBe("/api/v1/voting/events/evt-sin-consulta/eligibility/public");
    expect(disabledUrl.searchParams.get("carnet")).toBe("1234567");
    expect(disabledInit).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    expect(screen.queryByText("configuración privada")).not.toBeInTheDocument();
    expect(screen.queryByText("admin@private.test")).not.toBeInTheDocument();
  });
});
