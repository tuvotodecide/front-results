import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import PadronCheckModal from "@/features/padronCheck/PadronCheckModal";
import { PadronCheckServiceApi } from "@/features/padronCheck/PadronCheckService.api";

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
      <div role="dialog" aria-label={title}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

vi.mock("../../src/components/Modal2", () => ({
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
      <div role="dialog" aria-label={title}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    ) : null,
}));

const fetchMock = vi.fn();
const sensitiveTexts = [
  "Ana Perez",
  "ana@example.com",
  "1990-01-01",
  "carnetNorm",
  "padron completo",
  "DID",
  "wallet",
];

describe("MX-05 | Padrón, staging, elegibilidad y archivos | Frontend público", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it("PAD-ELG-P0-001 / PAD-SEC-P0-001 | consulta elegibilidad por evento sin exponer datos personales", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ELIGIBLE",
        eligible: true,
        referenceVersion: "ver-1",
        fullName: "Ana Perez",
        email: "ana@example.com",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new PadronCheckServiceApi();
    const result = await service.checkStatus("123 4567", "evt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/voting/events/evt-1/eligibility/public?carnet=123%204567"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
    expect(result).toEqual({
      kind: "single",
      status: "ELIGIBLE",
      carnet: "123 4567",
      referenceVersion: "ver-1",
    });
    expect(JSON.stringify(result)).not.toContain("Ana Perez");
    expect(JSON.stringify(result)).not.toContain("ana@example.com");
  });

  it("PAD-ELG-P0-002 / PAD-SEC-P0-001 | lista elegibilidad multi-evento sin enumerar padrón completo", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        carnet: "1234567",
        events: [
          {
            eventId: "evt-a",
            tenantId: "tenant-1",
            name: "Alpha elección",
            phase: "UPCOMING",
            status: "ELIGIBLE",
            eligible: true,
            referenceVersion: "ver-1",
            fullName: "Ana Perez",
          },
          {
            eventId: "evt-b",
            tenantId: "tenant-1",
            name: "Beta elección",
            phase: "ACTIVE",
            status: "NOT_ELIGIBLE",
            eligible: false,
            voters: [{ carnet: "7654321" }],
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new PadronCheckServiceApi();
    const result = await service.checkStatus("1234567");

    expect(result).toEqual({
      kind: "multi",
      carnet: "1234567",
      events: [
        expect.objectContaining({
          eventId: "evt-a",
          name: "Alpha elección",
          status: "ELIGIBLE",
          eligible: true,
        }),
        expect.objectContaining({
          eventId: "evt-b",
          name: "Beta elección",
          status: "NOT_ELIGIBLE",
          eligible: false,
        }),
      ],
    });
    expect(JSON.stringify(result)).not.toContain("Ana Perez");
    expect(JSON.stringify(result)).not.toContain("voters");
  });

  it("PAD-ELG-P0-001 / PAD-SEC-P0-001 | muestra elegible, no elegible, carga y error seguro", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "ELIGIBLE",
          eligible: true,
          fullName: "Ana Perez",
          email: "ana@example.com",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "NOT_ELIGIBLE", eligible: false }),
      })
      .mockRejectedValueOnce(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<PadronCheckModal isOpen onClose={vi.fn()} eventId="evt-1" />);

    fireEvent.change(screen.getByLabelText("Carnet de Identidad"), {
      target: { value: "1234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verificar/i }));

    expect(screen.getByText("Verificando...")).toBeInTheDocument();
    expect(await screen.findByText("HABILITADO")).toBeInTheDocument();
    sensitiveTexts.forEach((text) => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });

    rerender(<PadronCheckModal isOpen onClose={vi.fn()} eventId="evt-1" />);
    fireEvent.change(screen.getByLabelText("Carnet de Identidad"), {
      target: { value: "7654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verificar/i }));

    expect(await screen.findByText("NO HABILITADO")).toBeInTheDocument();

    rerender(<PadronCheckModal isOpen onClose={vi.fn()} eventId="evt-1" />);
    fireEvent.change(screen.getByLabelText("Carnet de Identidad"), {
      target: { value: "9999999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verificar/i }));

    expect(
      await screen.findByText("Error al verificar. Por favor intenta nuevamente."),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
