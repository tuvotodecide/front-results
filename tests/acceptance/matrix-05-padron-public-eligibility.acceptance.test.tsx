import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PadronCheckModal from "@/features/padronCheck/PadronCheckModal";

const jsonResponse = (body: unknown) => ({ ok: true, json: async () => body });
const privateValues = [
  "Ana Pérez",
  "ana@example.test",
  "+59170000000",
  "Calle Privada 123",
  "user-internal-1",
  "wallet-interna",
  "tenant-privado",
  "metadato administrativo",
];

const renderPublicCheck = (eventId?: string) =>
  render(<PadronCheckModal isOpen onClose={vi.fn()} eventId={eventId} />);

const submitCarnet = async (user: ReturnType<typeof userEvent.setup>, carnet: string) => {
  const dialog = screen.getByRole("dialog", { name: "Consulta tu estado en el Padrón" });
  await user.type(within(dialog).getByLabelText("Carnet de Identidad"), carnet);
  await user.click(within(dialog).getByRole("button", { name: "Verificar" }));
  return dialog;
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MX-05 | aceptación pública de elegibilidad", () => {
  it("[MX-05][PAD-ELG-P0-001][ACEPTACION] consulta por votación y muestra estados públicos sin datos adicionales", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    let resolveEligible!: (response: ReturnType<typeof jsonResponse>) => void;
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockImplementationOnce(
      () => new Promise<ReturnType<typeof jsonResponse>>((resolve) => { resolveEligible = resolve; }),
    );
    renderPublicCheck("evt-publico");
    const eligibleDialog = await submitCarnet(user, "12.345-67");
    expect(screen.getByText("Verificando...")).toBeInTheDocument();
    resolveEligible(jsonResponse({ status: "ELIGIBLE", fullName: "Ana Pérez", email: "ana@example.test" }));
    expect(await within(eligibleDialog).findByRole("heading", { name: "HABILITADO" })).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/voting/events/evt-publico/eligibility/public?carnet=1234567");

    cleanup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "NOT_ELIGIBLE" }));
    renderPublicCheck("evt-publico");
    expect(await within(await submitCarnet(user, "7654321")).findByRole("heading", { name: "NO HABILITADO" })).toBeInTheDocument();

    cleanup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "DISABLED" }));
    renderPublicCheck("evt-publico");
    expect(await within(await submitCarnet(user, "7654321")).findByRole("heading", { name: "DESHABILITADO" })).toBeInTheDocument();

    cleanup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "ROLL_IN_VALIDATION" }));
    renderPublicCheck("evt-publico");
    expect(await within(await submitCarnet(user, "7654321")).findByRole("heading", { name: "PADRÓN EN VALIDACIÓN" })).toBeInTheDocument();

    cleanup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "PUBLIC_CHECK_DISABLED" }));
    renderPublicCheck("evt-publico");
    expect(await within(await submitCarnet(user, "7654321")).findByRole("heading", { name: "CONSULTA DESHABILITADA" })).toBeInTheDocument();

    cleanup();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    renderPublicCheck("evt-publico");
    await submitCarnet(user, "7654321");
    expect(await screen.findByText("Error al verificar. Por favor intenta nuevamente.")).toBeInTheDocument();
    privateValues.slice(0, 2).forEach((value) => expect(screen.queryByText(value)).not.toBeInTheDocument());
  });

  it("[MX-05][PAD-ELG-P0-002][ACEPTACION] consulta eventos públicos visibles y conserva el orden de la respuesta pública", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        carnet: "1234567",
        events: [
          { eventId: "evt-alpha", tenantId: "tenant-visible", name: "Alpha elección", phase: "UPCOMING", status: "ELIGIBLE", eligible: true },
          { eventId: "evt-beta", tenantId: "tenant-visible", name: "Beta elección", phase: "ACTIVE", status: "NOT_ELIGIBLE", eligible: false },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPublicCheck();
    const dialog = await submitCarnet(user, "1234567");
    expect(await within(dialog).findByText("Alpha elección")).toBeInTheDocument();
    expect(within(dialog).getByText("Beta elección")).toBeInTheDocument();
    const names = within(dialog).getAllByText(/(Alpha|Beta) elección/).map((element) => element.textContent);
    expect(names).toEqual(["Alpha elección", "Beta elección"]);
    expect(within(dialog).getByText("HABILITADO")).toBeInTheDocument();
    expect(within(dialog).getByText("NO HABILITADO")).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/voting/events/public/eligibility-by-carnet?carnet=1234567");

    cleanup();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ carnet: "1234567", events: [] })));
    renderPublicCheck();
    await submitCarnet(user, "1234567");
    expect(await screen.findByText("No hay eventos visibles para este carnet.")).toBeInTheDocument();
  });

  it("[MX-05][PAD-SEC-P0-001][ACEPTACION] limita la superficie pública a estados permitidos", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "ELIGIBLE",
          fullName: "Ana Pérez",
          email: "ana@example.test",
          phone: "+59170000000",
          address: "Calle Privada 123",
          userId: "user-internal-1",
          wallet: "wallet-interna",
          tenantId: "tenant-privado",
          auditMetadata: "metadato administrativo",
        }),
      ),
    );
    renderPublicCheck("evt-seguro");
    const dialog = await submitCarnet(user, "1234567");
    expect(await within(dialog).findByRole("heading", { name: "HABILITADO" })).toBeInTheDocument();
    privateValues.forEach((value) => expect(screen.queryByText(value)).not.toBeInTheDocument());
    expect(screen.queryByText(/tenant|wallet|audit/i)).not.toBeInTheDocument();
  });
});
