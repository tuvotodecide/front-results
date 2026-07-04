import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParticipationAnalyticsModal from "@/features/electionConfig/components/ParticipationAnalyticsModal";
import { captureElementAsPng } from "@/features/electionConfig/captureElementAsPng";
import * as votingEvents from "@/store/votingEvents";

vi.mock("@/components/Modal2", () => ({
  default: ({ children, isOpen = true }: { children?: ReactNode; isOpen?: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("@/features/electionConfig/captureElementAsPng", () => ({
  captureElementAsPng: vi.fn(),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetParticipationAnalyticsQuery: vi.fn(),
  useDownloadParticipationReportWithScreenshotMutation: vi.fn(),
}));

const analytics = {
  votingId: "evt-1",
  votingName: "Elección de Diputados",
  institutionName: "Institución QA",
  status: "RESULTS_PUBLISHED" as const,
  publishedAt: "2026-07-04T10:00:00.000Z",
  totalEnabled: 3200,
  totalParticipated: 2342,
  totalPending: 858,
  participationPercentage: 73.2,
};

describe("ParticipationAnalyticsModal", () => {
  const downloadMutation = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(captureElementAsPng).mockResolvedValue("data:image/png;base64,captura-real");
    downloadMutation.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        ok: true,
        fileName: "participation-report-evt-1.pdf",
      }),
    });
    vi.mocked(votingEvents.useDownloadParticipationReportWithScreenshotMutation).mockReturnValue([
      downloadMutation,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: analytics,
      isFetching: false,
      isError: false,
      error: null,
    } as any);
  });

  it("renderiza datos de participación y privacidad sin campos sensibles", () => {
    render(
      <ParticipationAnalyticsModal
        isOpen
        eventId="evt-1"
        onClose={onClose}
        canDownloadReport
      />,
    );

    expect(screen.getByText("Analíticas")).toBeInTheDocument();
    expect(screen.getByText("Elección de Diputados")).toBeInTheDocument();
    expect(screen.getByText("Institución QA")).toBeInTheDocument();
    expect(screen.getByText("Habilitados")).toBeInTheDocument();
    expect(screen.getAllByText("Participaron").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("No participaron").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Pendientes")).not.toBeInTheDocument();
    expect(screen.getAllByText("73.2%")).toHaveLength(1);
    expect(screen.getByLabelText("Participación 73.2%")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-chart-column")).toContainElement(
      screen.getByTestId("analytics-donut"),
    );
    expect(screen.getByTestId("analytics-summary-column")).toHaveTextContent("Participación");
    expect(screen.getByTestId("analytics-summary-column")).toHaveTextContent("Estado");
    expect(screen.getByText(/Resultados publicados/)).toBeInTheDocument();
    expect(screen.getByText("Fecha publicación")).toBeInTheDocument();
    expect(
      screen.getByText("No se muestra por quién votó ninguna persona."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar reporte" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Cerrar" }).length).toBeGreaterThanOrEqual(2);
    expect(document.body).not.toHaveTextContent("candidateId");
    expect(document.body).not.toHaveTextContent("selectedCandidateId");
    expect(document.body).not.toHaveTextContent("candidateSelected");
    expect(document.body).not.toHaveTextContent("optionId");
    expect(document.body).not.toHaveTextContent("nullifier");
    expect(document.body).not.toHaveTextContent("proof");
    expect(document.body).not.toHaveTextContent("vote");
  });

  it("el área capturada no contiene canvas, imágenes externas ni svg que puedan taintar el canvas", () => {
    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    const captureArea = screen.getByTestId("participation-analytics-capture");

    expect(captureArea.querySelector("canvas")).toBeNull();
    expect(captureArea.querySelector("img")).toBeNull();
    expect(captureArea.querySelector("svg")).toBeNull();
  });

  it("captura solo el resumen visual y deja los controles fuera del PDF", () => {
    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    const captureArea = screen.getByTestId("participation-analytics-capture");

    expect(captureArea).toHaveTextContent("Analíticas");
    expect(captureArea).toHaveTextContent("Habilitados");
    expect(captureArea).toHaveTextContent("No se muestra por quién votó ninguna persona.");
    expect(captureArea).not.toHaveTextContent("Cerrar");
    expect(captureArea).not.toHaveTextContent("Descargar reporte");
    expect(captureArea).not.toHaveTextContent("Descargando...");
    expect(screen.getAllByRole("button", { name: "Cerrar" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Descargar reporte" })).toBeInTheDocument();
  });

  it("muestra Pendientes solo en votación en curso", () => {
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: { ...analytics, status: "IN_PROGRESS", publishedAt: null },
      isFetching: false,
      isError: false,
    } as any);

    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    expect(screen.getAllByText("Pendientes").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("No participaron")).not.toBeInTheDocument();
  });

  it("cierra el modal desde el botón Cerrar", async () => {
    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Cerrar" })[0]);

    expect(onClose).toHaveBeenCalled();
  });

  it("captura el modal real y envía modalScreenshot al endpoint de reporte", async () => {
    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Descargar reporte" }));

    await waitFor(() => {
      expect(captureElementAsPng).toHaveBeenCalledWith(
        screen.getByTestId("participation-analytics-capture"),
      );
      expect(downloadMutation).toHaveBeenCalledWith({
        eventId: "evt-1",
        modalScreenshot: "data:image/png;base64,captura-real",
      });
    });
  });

  it("muestra loading, error y vacío", () => {
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValueOnce({
      data: undefined,
      isFetching: true,
      isError: false,
    } as any);
    const { rerender } = render(
      <ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />,
    );
    expect(screen.getByText("Cargando analíticas...")).toBeInTheDocument();

    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValueOnce({
      data: undefined,
      isFetching: false,
      isError: true,
      error: { data: { message: "Sin permisos" } },
    } as any);
    rerender(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);
    expect(screen.getByText("Sin permisos")).toBeInTheDocument();

    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValueOnce({
      data: undefined,
      isFetching: false,
      isError: false,
    } as any);
    rerender(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);
    expect(screen.getByText("No hay datos de participación disponibles.")).toBeInTheDocument();
  });

  it("oculta descarga sin permiso visual y no muestra fecha falsa", () => {
    vi.mocked(votingEvents.useGetParticipationAnalyticsQuery).mockReturnValue({
      data: { ...analytics, publishedAt: null },
      isFetching: false,
      isError: false,
    } as any);

    render(
      <ParticipationAnalyticsModal
        isOpen
        eventId="evt-1"
        onClose={onClose}
        canDownloadReport={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Descargar reporte" })).not.toBeInTheDocument();
    expect(screen.queryByText("Fecha publicación")).not.toBeInTheDocument();
  });

  it("muestra errores controlados de captura y backend", async () => {
    vi.mocked(captureElementAsPng).mockRejectedValueOnce(new Error("captura fallida"));
    const { rerender } = render(
      <ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Descargar reporte" }));
    expect(await screen.findByText("captura fallida")).toBeInTheDocument();

    downloadMutation.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({ data: { message: "Sesión expirada" } }),
    });
    vi.mocked(captureElementAsPng).mockResolvedValueOnce("data:image/png;base64,captura-real");
    rerender(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Descargar reporte" }));
    expect(await screen.findByText("Sesión expirada")).toBeInTheDocument();
  });

  it("muestra descarga en progreso y evita doble envío", async () => {
    let resolveCapture: (value: string) => void = () => undefined;
    vi.mocked(captureElementAsPng).mockReturnValue(
      new Promise((resolve) => {
        resolveCapture = resolve;
      }),
    );

    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    const button = screen.getByRole("button", { name: "Descargar reporte" });
    await userEvent.click(button);
    expect(screen.getByRole("button", { name: "Descargando..." })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Descargando..." }));
    expect(captureElementAsPng).toHaveBeenCalledTimes(1);

    resolveCapture("data:image/png;base64,captura-real");
    await waitFor(() => expect(downloadMutation).toHaveBeenCalledTimes(1));
  });

  it("muestra estado de descarga cuando la mutación está en curso", () => {
    vi.mocked(votingEvents.useDownloadParticipationReportWithScreenshotMutation).mockReturnValue([
      downloadMutation,
      { isLoading: true },
    ] as any);

    render(<ParticipationAnalyticsModal isOpen eventId="evt-1" onClose={onClose} />);

    expect(screen.getByRole("button", { name: "Descargando..." })).toBeDisabled();
  });
});
